import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let apiKey = req.headers.get("Authorization")?.replace("Basic ", "");
    
    if (!apiKey) {
      apiKey = req.headers.get("x-api-key");
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({ message: "Missing API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

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

    const body = await req.json();
    const playerName = body.playerName;

    if (!playerName) {
      return new Response(
        JSON.stringify({ message: "Player name is required" }),
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
        JSON.stringify([]),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claims: any[] = [];

    for (const txn of pendingTxns) {
      const cartItems = typeof txn.cart_items === "string" ? JSON.parse(txn.cart_items) : txn.cart_items;
      
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
            player_name: playerName,
            product_id: product.numeric_id || parseInt(product.id.replace(/\D/g, "")) || 1,
            product_amount: quantity,
            amount_purchased: quantity,
            product_name: product.name,
            product_price: parseFloat(product.price)
          });
        }
      }

      await supabase
        .from("pending_transactions")
        .update({ status: "claimed", updated_at: new Date().toISOString() })
        .eq("id", txn.id);

      const orderId = `ord-${Date.now()}`;
      await supabase.from("orders").insert({
        id: orderId,
        server_id: server.id,
        username: playerName,
        status: "delivered",
        total: txn.total
      });

      const orderItems = claims
        .filter(c => c.player_name === playerName)
        .map((c, idx) => ({
          id: `oi-${Date.now()}-${idx}`,
          order_id: orderId,
          product_id: String(c.product_id),
          product_name: c.product_name,
          quantity: c.amount_purchased,
          price: c.product_price
        }));

      if (orderItems.length > 0) {
        await supabase.from("order_items").insert(orderItems);
      }
    }

    return new Response(
      JSON.stringify(claims),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify([]),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
