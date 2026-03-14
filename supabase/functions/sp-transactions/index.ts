/**
 * sp-transactions — ScapePulse Java SDK endpoint
 *
 * Validates the server's API key, then atomically fetches all paid+unclaimed
 * transactions for a player and marks them claimed in one operation.
 *
 * Deployed with --no-verify-jwt so no Supabase anon key is needed by the caller.
 * Auth is performed via the server's own API key in the Authorization header.
 *
 * POST /functions/v1/sp-transactions
 * Authorization: Bearer <server-api-key>
 * { "playerName": "PlayerOne" }
 *
 * Responses:
 *   200 { status: "SUCCESS", claims: [...] }
 *   200 { status: "NO_ITEMS", claims: [] }
 *   401 { status: "ERROR", message: "..." }
 *   400 { status: "ERROR", message: "..." }
 *   500 { status: "ERROR", message: "..." }
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

    // ── 2. Connect with service role key (never exposed to callers) ──────────
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ── 3. Validate API key → resolve server ─────────────────────────────────
    const { data: server, error: serverErr } = await supabase
      .from("servers")
      .select("id, name")
      .eq("api_key", apiKey)
      .single();

    if (serverErr || !server) {
      return json({ status: "ERROR", message: "Invalid API key" }, 401);
    }

    // ── 4. Parse request body ────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const playerName: string | undefined = body.playerName;

    if (!playerName?.trim()) {
      return json({ status: "ERROR", message: "playerName is required" }, 400);
    }

    // ── 5. Fetch paid + unclaimed transactions ───────────────────────────────
    const { data: txns, error: txnErr } = await supabase
      .from("pending_transactions")
      .select("*")
      .eq("server_id", server.id)
      .ilike("username", playerName.trim())
      .eq("status", "paid")
      .eq("claimed", false)
      .order("created_at", { ascending: true });

    if (txnErr) throw txnErr;

    if (!txns || txns.length === 0) {
      return json({ status: "NO_ITEMS", message: "No pending purchases.", claims: [] });
    }

    // ── 6. Build claims list and mark everything claimed atomically ──────────
    const claims: unknown[] = [];
    const txnIds: string[] = txns.map((t) => t.id);

    for (const txn of txns) {
      const cartItems = Array.isArray(txn.cart_items)
        ? txn.cart_items
        : JSON.parse(txn.cart_items ?? "[]");

      for (const item of cartItems) {
        // Resolve full product details (numeric_id is used by game server plugins)
        const { data: product } = await supabase
          .from("products")
          .select("id, numeric_id, name, item_id, price, commands")
          .eq("server_id", server.id)
          .eq("numeric_id", item.id)
          .maybeSingle();

        claims.push({
          player_name:        playerName.trim(),
          product_id:         product?.numeric_id ?? item.id ?? 0,
          product_name:       product?.name ?? item.product_name ?? "",
          product_price:      product ? parseFloat(product.price) : (item.price ?? 0),
          product_amount:     item.quantity ?? 1,
          game_item_id:       product?.item_id ?? null,
          commands:           product?.commands ?? [],
          transaction_id:     txn.id,
        });
      }

      // Create delivered order record
      const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await supabase.from("orders").insert({
        id:        orderId,
        server_id: server.id,
        username:  playerName.trim(),
        status:    "delivered",
        total:     txn.total,
      });

      const orderItems = claims
        .filter((c: any) => c.transaction_id === txn.id)
        .map((c: any, idx: number) => ({
          id:           `oi-${Date.now()}-${idx}`,
          order_id:     orderId,
          product_id:   String(c.product_id),
          product_name: c.product_name,
          quantity:     c.product_amount,
          price:        c.product_price,
        }));

      if (orderItems.length > 0) {
        await supabase.from("order_items").insert(orderItems);
      }
    }

    // Mark all transactions claimed in one batch update
    await supabase
      .from("pending_transactions")
      .update({ status: "claimed", claimed: true, updated_at: new Date().toISOString() })
      .in("id", txnIds);

    return json({
      status:  "SUCCESS",
      message: "Transactions claimed successfully.",
      claims,
    });
  } catch (err: any) {
    console.error("[sp-transactions]", err);
    return json({ status: "ERROR", message: err?.message ?? "Internal error" }, 500);
  }
});
