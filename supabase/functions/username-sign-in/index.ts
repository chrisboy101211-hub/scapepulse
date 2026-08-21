import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://scapepulse.com",
  "https://www.scapepulse.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

const attempts = new Map<string, { count: number; resetAt: number }>();

function corsHeaders(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: Record<string, unknown>, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } });
}

function limited(key: string) {
  const now = Date.now();
  const current = attempts.get(key);
  if (!current || now > current.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 10;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const body = await req.json().catch(() => null);
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!/^[a-z0-9_]{3,30}$/.test(username) || !password) return json({ error: "Invalid username or password" }, 400, origin);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (limited(`${ip}:${username}`)) return json({ error: "Too many attempts. Please wait and try again." }, 429, origin);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const admin = createClient(url, serviceRoleKey);
  const { data: mapping } = await admin.from("account_usernames").select("user_id").eq("username", username).maybeSingle();
  if (!mapping) return json({ error: "Invalid username or password" }, 401, origin);

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(mapping.user_id);
  const email = userResult?.user?.email;
  if (userError || !email) return json({ error: "Invalid username or password" }, 401, origin);

  const auth = createClient(url, anonKey);
  const { data: authData, error: authError } = await auth.auth.signInWithPassword({ email, password });
  if (authError || !authData.session) return json({ error: "Invalid username or password" }, 401, origin);

  return json({ session: authData.session }, 200, origin);
});
