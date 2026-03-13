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
        JSON.stringify({ statusCode: "400", status: "ERROR", message: "Missing authorization header" }),
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
        JSON.stringify({ statusCode: "400", status: "ERROR", message: "Invalid API key" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { username, cartItems } = body;

    if (!username) {
      return new Response(
        JSON.stringify({ statusCode: "400", status: "ERROR", message: "Username is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!cartItems) {
      return new Response(
        JSON.stringify({ statusCode: "400", status: "ERROR", message: "Cart items are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let parsedCart: Array<{ id: number; quantity: number }>;
    try {
      parsedCart = typeof cartItems === "string" ? JSON.parse(cartItems) : cartItems;
    } catch {
      return new Response(
        JSON.stringify({ statusCode: "400", status: "ERROR", message: "Invalid cart items format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!Array.isArray(parsedCart) || parsedCart.length === 0) {
      return new Response(
        JSON.stringify({ statusCode: "400", status: "ERROR", message: "Cart is empty" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const productIds = parsedCart.map((item: any) => item.id);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*, categories!inner(numeric_id)")
      .eq("server_id", server.id)
      .in("numeric_id", productIds);

    if (productsError || !products || products.length === 0) {
      return new Response(
        JSON.stringify({ statusCode: "400", status: "ERROR", message: "No valid products found in cart" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productMap = new Map(products.map((p: any) => [p.numeric_id, p]));
    let total = 0;
    const orderItems: any[] = [];

    for (const cartItem of parsedCart) {
      const product = productMap.get(cartItem.id);
      if (!product) continue;
      
      const quantity = cartItem.quantity || 1;
      const itemTotal = parseFloat(product.price) * quantity;
      total += itemTotal;
      
      orderItems.push({
        id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        product_id: product.id,
        product_name: product.name,
        quantity: quantity,
        price: product.price
      });
    }

    if (total === 0) {
      return new Response(
        JSON.stringify({
          statusCode: "200",
          status: "SUCCESS",
          redirect: null,
          transactionId: crypto.randomUUID(),
          isFree: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transactionId = crypto.randomUUID();
    const transactionRecord = {
      id: `txn-${Date.now()}`,
      server_id: server.id,
      username: username,
      cart_items: JSON.stringify(parsedCart),
      total: total,
      transaction_id: transactionId,
      status: "pending"
    };

    const { error: txnError } = await supabase
      .from("pending_transactions")
      .insert(transactionRecord);

    if (txnError) {
      console.error("Failed to create pending transaction:", txnError);
    }

    const baseUrl = Deno.env.get("BASE_URL") || "https://scapepulse.com";
    const redirectUrl = `${baseUrl}/checkout/${transactionId}?username=${encodeURIComponent(username)}`;

    return new Response(
      JSON.stringify({
        statusCode: "200",
        status: "SUCCESS",
        redirect: redirectUrl,
        transactionId: transactionId,
        isFree: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ statusCode: "500", status: "ERROR", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
