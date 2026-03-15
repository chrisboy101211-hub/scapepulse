/**
 * sp-toplist-vote — Toplist vote handler with callback delivery
 *
 * Identical flow to runespace/vote/route.ts:
 *   1. Validate player hasn't voted in the last 12 hours (by IP)
 *   2. Record vote in toplist_votes + increment toplist_servers.votes
 *   3. Insert into fx_votes with callback_date = NOW() (for Java SupabaseVoteProcessor)
 *   4. Fire GET callback to server.callback_url?uid=<key>&voter_name=<username>
 *      Falls back to POST if GET returns 405.
 *
 * POST /functions/v1/sp-toplist-vote
 * Body: { "server_id": 1, "username": "PlayerOne" }
 *
 * Deploy with: supabase functions deploy sp-toplist-vote --no-verify-jwt
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-forwarded-for",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1"
  );
}

/** Fire GET callback, falling back to POST on 405 — exactly as runespace does. */
async function sendVoteCallback(
  callbackUrl: string,
  voteKey: string,
  username: string,
): Promise<void> {
  const params = new URLSearchParams({ uid: voteKey, voter_name: username });
  const separator = callbackUrl.includes("?") ? "&" : "?";
  const fullUrl = `${callbackUrl}${separator}${params.toString()}`;

  console.log(`[sp-toplist-vote] Firing callback → ${fullUrl}`);

  try {
    let res = await fetch(fullUrl, {
      method: "GET",
      headers: { "User-Agent": "ScapePulse-Vote-Callback/1.0" },
      signal: AbortSignal.timeout(10_000),
    });

    if (res.status === 405) {
      // Fallback to POST with form body
      res = await fetch(callbackUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "ScapePulse-Vote-Callback/1.0",
        },
        body: params.toString(),
        signal: AbortSignal.timeout(10_000),
      });
    }

    if (res.ok) {
      console.log(`[sp-toplist-vote] ✅ Callback delivered (${res.status})`);
    } else {
      console.error(`[sp-toplist-vote] ❌ Callback returned ${res.status}`);
    }
  } catch (err) {
    console.error(`[sp-toplist-vote] ❌ Callback error:`, err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Parse body ─────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    const serverId: number | undefined = body?.server_id;
    const username: string | undefined = body?.username;

    if (!serverId || !username?.trim()) {
      return json({ error: "server_id and username are required" }, 400);
    }

    const cleanUsername = username.trim().replace(/[^A-Za-z0-9_ ]/g, "").substring(0, 64);
    if (!cleanUsername) return json({ error: "Invalid username" }, 400);

    const ipAddress = getIP(req);

    // ── Load server ────────────────────────────────────────────────────────────
    const { data: server, error: serverErr } = await supabase
      .from("toplist_servers")
      .select("id, name, votes, monthly_votes, callback_url, is_active")
      .eq("id", serverId)
      .single();

    if (serverErr || !server) return json({ error: "Server not found" }, 404);
    if (!server.is_active) return json({ error: "Server is not active" }, 400);

    // ── 12-hour rate limit by IP ───────────────────────────────────────────────
    const since12h = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { count: recentVotes } = await supabase
      .from("toplist_votes")
      .select("id", { count: "exact", head: true })
      .eq("server_id", serverId)
      .eq("ip_address", ipAddress)
      .gte("created_at", since12h);

    if ((recentVotes ?? 0) >= 1) {
      return json({ error: "You have already voted for this server in the last 12 hours" }, 429);
    }

    // ── Generate vote key ──────────────────────────────────────────────────────
    const voteKey = crypto.randomUUID().replace(/-/g, "").substring(0, 16);

    // ── Record vote in toplist_votes ───────────────────────────────────────────
    await supabase.from("toplist_votes").insert({
      server_id: serverId,
      ip_address: ipAddress,
      vote_site: "direct",
    });

    // ── Increment vote counters ────────────────────────────────────────────────
    await supabase
      .from("toplist_servers")
      .update({
        votes: server.votes + 1,
        monthly_votes: server.monthly_votes + 1,
      })
      .eq("id", serverId);

    // ── Insert into fx_votes (Java SupabaseVoteProcessor reads this) ───────────
    await supabase.from("fx_votes").insert({
      uid: voteKey,
      username: cleanUsername,
      server_id: serverId,
      ip_address: ipAddress,
      started: new Date().toISOString(),
      callback_date: new Date().toISOString(), // confirmed immediately — it's a direct toplist vote
      claimed: 0,
    });

    // ── Fire callback (fire-and-forget, non-blocking) ──────────────────────────
    if (server.callback_url) {
      sendVoteCallback(server.callback_url, voteKey, cleanUsername).catch(() => {});
    }

    return json({
      success: true,
      message: "Vote recorded",
      newVoteCount: server.votes + 1,
    });
  } catch (e: any) {
    console.error("[sp-toplist-vote]", e);
    return json({ error: e?.message ?? "Internal error" }, 500);
  }
});
