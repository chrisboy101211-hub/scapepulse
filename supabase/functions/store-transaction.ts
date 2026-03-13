import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Claim {
  player_name: string;
  product_id: number;
  product_id_string: string;
  quantity_to_grant: number;
  quantity_purchased: number;
  product_name: string;
  product_price: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ status: "ERROR", code: "INVALID_API_KEY", message: "Missing authorization header", data: { claims: [] } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const apiKey = authHeader.replace("Basic ", "");
    const decodedKey = atob(apiKey);

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
        JSON.stringify({ status: "ERROR", code: "SERVER_NOT_FOUND", message: "Invalid API key", data: { claims: [] } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { playerName, preview = false, includeRawTransactions = false } = body;

    if (!playerName) {
      return new Response(
        JSON.stringify({ status: "ERROR", code: "INVALID_PLAYER", message: "Player name is required", data: { claims: [] } }),
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
        JSON.stringify({ status: "SUCCESS", code: "NO_ITEMS", message: "There are currently no items to claim.", data: { claims: [] } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claims: Claim[] = [];

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
          const commands = product.commands || [];
          
          claims.push({
            player_name: playerName,
            product_id: product.numeric_id || parseInt(product.id.replace(/\D/g, "")) || 1,
            product_id_string: String(product.numeric_id || parseInt(product.id.replace(/\D/g, "")) || 1),
            quantity_to_grant: quantity,
            quantity_purchased: quantity,
            product_name: product.name,
            product_price: parseFloat(product.price)
          });
        }
      }

      if (!preview) {
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
            quantity: c.quantity_purchased,
            price: c.product_price
          }));

        if (orderItems.length > 0) {
          await supabase.from("order_items").insert(orderItems);
        }
      }
    }

    const rawTransactions = includeRawTransactions ? pendingTxns : [];

    return new Response(
      JSON.stringify({
        status: preview ? "PREVIEW" : "SUCCESS",
        code: preview ? "PREVIEW" : "SUCCESS",
        message: preview ? "Preview mode - no items were granted." : "Transaction has been completed. Thank you for your purchase!",
        data: {
          claims,
          rawTransactions
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ status: "ERROR", code: "ERROR", message: error.message, data: { claims: [] } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
