import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ message: "Missing API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    let apiKey = authHeader.replace("Bearer ", "");
    
    let decodedKey = apiKey;
    try {
      decodedKey = atob(apiKey);
    } catch {
      decodedKey = apiKey;
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: server, error: serverError } = await supabase
      .from("servers")
      .select("*")
      .eq("api_key", decodedKey)
      .single();

    if (serverError || !server) {
      return new Response(
        JSON.stringify({ message: "Invalid API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(
        JSON.stringify({ status: "ERROR", message: "Invalid request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const playerName = typeof body.playerName === "string" ? body.playerName.trim() : "";

    if (!playerName) {
      return new Response(
        JSON.stringify({ status: "ERROR", message: "Player name is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate player name — alphanumeric, spaces, underscores, hyphens, 1-30 chars
    if (!/^[a-zA-Z0-9_ -]{1,30}$/.test(playerName)) {
      return new Response(
        JSON.stringify({ status: "ERROR", message: "Invalid player name" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: pendingTxns, error: txnError } = await supabase
      .from("pending_transactions")
      .select("*")
      .eq("server_id", server.id)
      .eq("username", playerName)
      .eq("status", "paid")
      .order("created_at", { ascending: true });

    if (txnError || !pendingTxns || pendingTxns.length === 0) {
      return new Response(
        JSON.stringify({ 
          status: "NO_ITEMS",
          message: "There are currently no items to claim.",
          data: { claims: [] }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claims: any[] = [];

    for (const txn of pendingTxns) {
      // Atomic claim: only update if status is still "paid" — prevents double-delivery
      const { data: claimGuard } = await supabase
        .from("pending_transactions")
        .update({ status: "claimed", updated_at: new Date().toISOString() })
        .eq("id", txn.id)
        .eq("status", "paid") // guard — only succeeds once
        .select("id");

      if (!claimGuard || claimGuard.length === 0) {
        // Already claimed by a concurrent request — skip
        continue;
      }

      let cartItems: any[] = [];
      try {
        cartItems = typeof txn.cart_items === "string" ? JSON.parse(txn.cart_items) : txn.cart_items;
        if (!Array.isArray(cartItems)) cartItems = [];
      } catch (e) {
        console.error(`Invalid cart_items for transaction ${txn.id}:`, e);
        continue;
      }
      
      for (const item of cartItems) {
        const { data: product } = await supabase
          .from("products")
          .select("*")
          .eq("server_id", server.id)
          .eq("numeric_id", item.id)
          .single();

        if (product) {
          const quantity = item.quantity || 1;
          
          claims.push({
            playerName: playerName,
            productId: product.numeric_id || parseInt(product.id.replace(/\D/g, "")) || 1,
            productIdString: String(product.numeric_id || parseInt(product.id.replace(/\D/g, "")) || 1),
            quantityToGrant: quantity,
            quantityPurchased: quantity,
            productName: product.name,
            productPrice: parseFloat(product.price),
            gameItemId: product.item_id
          });
        }
      }

      const orderId = `ord-${Date.now()}`;
      await supabase.from("orders").insert({
        id: orderId,
        server_id: server.id,
        username: playerName,
        status: "delivered",
        total: txn.total
      });

      const orderItems = claims
        .filter(c => c.playerName === playerName)
        .map((c, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          order_id: orderId,
          product_id: String(c.productId),
          product_name: c.productName,
          quantity: c.quantityPurchased,
          price: c.productPrice
        }));

      if (orderItems.length > 0) {
        await supabase.from("order_items").insert(orderItems);
      }
    }

    return new Response(
      JSON.stringify({
        status: "SUCCESS",
        code: "SUCCESS",
        message: "Transaction has been completed. Thank you for your purchase!",
        data: {
          claims
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "ERROR", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
