/**
 * sp-hiscores — ScapePulse Java SDK endpoint
 *
 * Handles both skill hiscores and boss kill counts for a player.
 * Deployed with --no-verify-jwt.
 *
 * POST /functions/v1/sp-hiscores
 * Authorization: Bearer <server-api-key>
 *
 * Actions (passed in request body as "action" field):
 *
 *   sync        — upsert a player's full hiscores record
 *   getPlayer   — fetch a single player's record
 *   leaderboard — fetch top N players for this server
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

    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? "sync";

    // ── Action: sync ─────────────────────────────────────────────────────────
    if (action === "sync") {
      const playerName: string | undefined = body.playerName;
      if (!playerName?.trim()) {
        return json({ status: "ERROR", message: "playerName is required" }, 400);
      }

      const record = {
        id:           `hs-${server.id}-${playerName.toLowerCase().replace(/\s+/g, "_")}`,
        server_id:    server.id,
        username:     playerName.trim(),
        game_mode:    body.gameMode    ?? "REGULAR",
        xp_mode:      body.xpMode      ?? "NORMAL",
        total_level:  body.totalLevel  ?? 0,
        total_xp:     body.totalXp     ?? 0,
        combat_level: body.combatLevel ?? 3,
        skill_levels: body.skillLevels ?? {},
        skill_xp:     body.skillXp     ?? {},
        boss_kills:   body.bossKills   ?? {},
        last_updated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("hiscores")
        .upsert(record, { onConflict: "server_id,username" });

      if (error) throw error;

      return json({ status: "SUCCESS", message: "Hiscores updated." });
    }

    // ── Action: getPlayer ─────────────────────────────────────────────────────
    if (action === "getPlayer") {
      const playerName: string | undefined = body.playerName;
      if (!playerName?.trim()) {
        return json({ status: "ERROR", message: "playerName is required" }, 400);
      }

      const { data, error } = await supabase
        .from("hiscores")
        .select("*")
        .eq("server_id", server.id)
        .ilike("username", playerName.trim())
        .maybeSingle();

      if (error) throw error;
      if (!data) return json({ status: "NOT_FOUND", message: "Player not found." }, 404);

      return json({ status: "SUCCESS", data });
    }

    // ── Action: leaderboard ───────────────────────────────────────────────────
    if (action === "leaderboard") {
      const limit = Math.min(Math.max(parseInt(body.limit ?? "50"), 1), 100);
      const gameMode: string | undefined = body.gameMode;
      const xpMode: string | undefined = body.xpMode;

      let query = supabase
        .from("hiscores")
        .select("*")
        .eq("server_id", server.id)
        .order("total_xp", { ascending: false })
        .limit(limit);

      if (gameMode) query = query.eq("game_mode", gameMode);
      if (xpMode)   query = query.eq("xp_mode",   xpMode);

      const { data, error } = await query;
      if (error) throw error;

      return json({ status: "SUCCESS", data: data ?? [] });
    }

    return json({ status: "ERROR", message: `Unknown action: ${action}` }, 400);

  } catch (err: any) {
    console.error("[sp-hiscores]", err);
    return json({ status: "ERROR", message: err?.message ?? "Internal error" }, 500);
  }
});
