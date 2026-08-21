/**
 * sp-toplist-callback — Vote confirmation endpoint
 *
 * Called by external vote sites after a player votes.
 * Receives the uid that was embedded in the vote link, confirms the vote,
 * increments the server's vote count, and fires the server's own callback_url.
 *
 * GET  /functions/v1/sp-toplist-callback?uid=<voteKey>
 * POST /functions/v1/sp-toplist-callback   body: uid=<voteKey>  (form or JSON)
 *
 * Deploy with: supabase functions deploy sp-toplist-callback --no-verify-jwt
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function ok(body: unknown = { status: "OK" }) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ status: "ERROR", message: msg }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function getIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    ""
  );
}

/** Fire GET → fallback POST to the server's own callback_url. */
async function forwardCallback(callbackUrl: string, uid: string): Promise<void> {
  const params = new URLSearchParams({ uid });
  const sep = callbackUrl.includes("?") ? "&" : "?";
  try {
    let res = await fetch(`${callbackUrl}${sep}${params}`, {
      method: "GET",
      headers: { "User-Agent": "ScapePulse-Vote-Callback/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 405) {
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
    console.log(`[sp-toplist-callback] forward → ${res.status}`);
  } catch (e) {
    console.error(`[sp-toplist-callback] forward error:`, e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── Extract uid from GET params or POST body ───────────────────────────────
    const url = new URL(req.url);
    let uid = url.searchParams.get("uid") ?? "";
    const sid = url.searchParams.get("sid");

    if (!uid && req.method === "POST") {
      const ct = req.headers.get("content-type") ?? "";
      if (ct.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        uid = body?.uid ?? "";
      } else {
        const text = await req.text().catch(() => "");
        uid = new URLSearchParams(text).get("uid") ?? "";
      }
    }

    if (!uid) return err("Missing uid", 400);

    // ── Load a pre-registered vote record, when one exists ─────────────────────
    const { data: existingVote } = await supabase
      .from("fx_votes")
      .select("id, server_id, callback_date")
      .eq("uid", uid)
      .single();

    const pathServerId = sid && /^\d+$/.test(sid) ? Number(sid) : null;
    if (sid && !pathServerId) return err("Invalid server ID", 400);

    // The public ScapePulse callback URL includes the server ID. Verify that
    // it matches any pre-registered vote key before confirming or forwarding.
    if (existingVote && pathServerId && pathServerId !== existingVote.server_id) {
      return err("Vote does not belong to this server", 400);
    }

    // Idempotent — already confirmed
    if (existingVote?.callback_date !== null && existingVote) {
      return ok({ status: "OK", message: "Already confirmed" });
    }

    // A server-issued incentive can arrive without a local fx_votes row. It is
    // accepted only through the public /toplist/vote/{sid}/{incentive} route,
    // then stored so the same incentive cannot be confirmed twice.
    if (!existingVote && !pathServerId) return err("Vote not found", 404);
    if (!existingVote && !/^[A-Za-z0-9_-]{12,128}$/.test(uid)) {
      return err("Invalid incentive", 400);
    }

    const serverId = existingVote?.server_id ?? pathServerId!;
    const { data: server } = await supabase
      .from("toplist_servers")
      .select("votes, monthly_votes, callback_url, is_active")
      .eq("id", serverId)
      .single();

    if (!server) return err("Server not found", 404);
    if (!server.is_active) return err("Server is not active", 400);

    if (existingVote) {
      await supabase
        .from("fx_votes")
        .update({ callback_date: new Date().toISOString() })
        .eq("id", existingVote.id);
    } else {
      const { error: insertError } = await supabase
        .from("fx_votes")
        .insert({
          uid,
          username: "external-incentive",
          server_id: serverId,
          ip_address: getIP(req) || null,
          started: new Date().toISOString(),
          callback_date: new Date().toISOString(),
          claimed: false,
        });

      if (insertError) return err("Incentive was already used", 409);
    }

    // ── Increment toplist vote counter ─────────────────────────────────────────
    await supabase
      .from("toplist_servers")
      .update({ votes: server.votes + 1, monthly_votes: server.monthly_votes + 1 })
      .eq("id", serverId);

    // ── Forward to the game server's own callback_url ──────────────────────────
    if (server.callback_url) {
      forwardCallback(server.callback_url, uid).catch(() => {});
    }

    console.log(`[sp-toplist-callback] ✅ Confirmed uid=${uid}`);
    return ok({ status: "OK", message: "Vote confirmed" });

  } catch (e: any) {
    console.error("[sp-toplist-callback]", e);
    return err(e?.message ?? "Internal error", 500);
  }
});
