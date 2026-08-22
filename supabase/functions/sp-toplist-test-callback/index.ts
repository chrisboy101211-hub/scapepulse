/**
 * Sends a harmless delivery check to the callback URL saved on the caller's
 * listing. Deploy with: supabase functions deploy sp-toplist-test-callback
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS, "Content-Type": "application/json" },
});

function isPublicHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost") || host === "::1") return false;
    if (/^127\.|^10\.|^0\.|^169\.254\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ delivered: false, message: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ delivered: false, message: "Sign in to test a callback." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return json({ delivered: false, message: "Your session has expired. Please sign in again." }, 401);

    const body = await req.json().catch(() => ({}));
    const serverId = Number(body?.server_id);
    if (!Number.isInteger(serverId) || serverId <= 0) return json({ delivered: false, message: "Invalid listing." }, 400);

    const { data: server } = await supabase
      .from("toplist_servers")
      .select("callback_url")
      .eq("id", serverId)
      .eq("user_id", user.id)
      .maybeSingle();
    const callbackUrl = server?.callback_url?.trim();
    if (!callbackUrl) return json({ delivered: false, message: "Add and save a callback URL first." }, 400);
    if (!isPublicHttpUrl(callbackUrl)) return json({ delivered: false, message: "The saved callback URL must be a public HTTP(S) URL." }, 400);

    const url = new URL(callbackUrl);
    url.searchParams.set("uid", `scapepulse_test_${crypto.randomUUID().replaceAll("-", "")}`);
    url.searchParams.set("voter_name", "ScapePulse_Test");
    url.searchParams.set("test", "1");

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { "User-Agent": "ScapePulse-Callback-Tester/1.0" },
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) return json({ delivered: true, status: response.status, message: "Your callback responded successfully." });
      return json({ delivered: false, status: response.status, message: "Your callback returned an error response." });
    } catch {
      return json({ delivered: false, message: "We could not reach your callback URL. Check that it is public and accepting GET requests." });
    }
  } catch (error) {
    console.error("[sp-toplist-test-callback]", error);
    return json({ delivered: false, message: "The callback test could not be completed." }, 500);
  }
});
