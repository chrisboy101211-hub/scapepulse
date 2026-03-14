/**
 * sp-votes — ScapePulse Java SDK endpoint
 *
 * Returns vote records for a player on this server.
 * Deployed with --no-verify-jwt.
 *
 * POST /functions/v1/sp-votes
 * Authorization: Bearer <server-api-key>
 * { "playerName": "PlayerOne", "sinceTimestamp": "2026-01-01T00:00:00Z" (optional) }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-api-key",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // ── 1. Extract API key ───────────────────────────────────────────────────
    const auth = req.headers.get("Authorization") ?? req.headers.get("x-api-key");
    if (!auth) return json({ status: "ERROR", message: "Missing API key" }, 401);
    const apiKey = auth.replace(/^Bearer\s+/i, "").trim();

    // ── 2. Connect with service role key ─────────────────────────────────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 3. Validate API key ──────────────────────────────────────────────────
    const { data: server, error: serverErr } = await supabase
      .from("servers")
      .select("id, name")
      .eq("api_key", apiKey)
      .single();

    if (serverErr || !server) {
      return json({ status: "ERROR", message: "Invalid API key" }, 401);
    }

    // ── 4. Parse body ────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const playerName: string | undefined = body.playerName;
    const since: string | undefined = body.sinceTimestamp;

    if (!playerName?.trim()) {
      return json({ status: "ERROR", message: "playerName is required" }, 400);
    }

    // ── 5. Query votes ───────────────────────────────────────────────────────
    let query = supabase
      .from("votes")
      .select("id, server_id, username, vote_site, timestamp")
      .eq("server_id", server.id)
      .ilike("username", playerName.trim())
      .order("timestamp", { ascending: false });

    if (since) {
      query = query.gt("timestamp", since);
    }

    const { data: votes, error: votesErr } = await query;
    if (votesErr) throw votesErr;

    return json({
      status: "SUCCESS",
      count:  votes?.length ?? 0,
      votes:  votes ?? [],
    });

  } catch (err: any) {
    console.error("[sp-votes]", err);
    return json({ status: "ERROR", message: err?.message ?? "Internal error" }, 500);
  }
});
