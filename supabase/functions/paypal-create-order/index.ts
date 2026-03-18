import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS: restrict to our frontend domain only — not wildcard
const ALLOWED_ORIGINS = [
  "https://scapepulse.com",
  "https://www.scapepulse.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

function corsHeaders(origin: string | null) {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function jsonError(message: string, status = 400, origin: string | null = null) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

// Simple in-function rate limiting (keyed by server_id, max 20 orders/minute)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  return false;
}

// Input validation helpers
function isValidUsername(name: string): boolean {
  return /^[a-zA-Z0-9_ -]{1,30}$/.test(name);
}
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return jsonError("Invalid JSON body", 400, origin);
    }

    const { server_id, cart_items, username, customer_email } = body;

    // ── Input validation ──────────────────────────────────────────────────

    if (!server_id || typeof server_id !== "string" || server_id.length > 64) {
      return jsonError("Invalid server_id", 400, origin);
    }
    if (!username || !isValidUsername(String(username))) {
      return jsonError("Invalid username. Use 1–30 alphanumeric characters.", 400, origin);
    }
    if (customer_email && !isValidEmail(String(customer_email))) {
      return jsonError("Invalid email address", 400, origin);
    }
    if (!Array.isArray(cart_items) || cart_items.length === 0 || cart_items.length > 50) {
      return jsonError("Cart must contain 1–50 items", 400, origin);
    }
    for (const item of cart_items) {
      if (!item.product_id || typeof item.product_id !== "string") {
        return jsonError("Each cart item must have a valid product_id", 400, origin);
      }
      const qty = Number(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
        return jsonError("Item quantity must be between 1 and 999", 400, origin);
      }
    }

    // ── Rate limiting ─────────────────────────────────────────────────────
    if (isRateLimited(`create:${server_id}`, 20, 60_000)) {
      return jsonError("Too many requests. Please wait before trying again.", 429, origin);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Fetch gateway config ──────────────────────────────────────────────
    const { data: gateway, error: gwErr } = await supabase
      .from("server_payment_gateways")
      .select("paypal_client_id, paypal_client_secret_enc, paypal_email, paypal_mode, instant_payments_only, checkout_language, require_shipping_address, basket_limit_enabled, basket_limit_amount")
      .eq("server_id", server_id)
      .eq("provider", "paypal")
      .eq("enabled", true)
      .single();

    if (gwErr || !gateway) {
      return jsonError("PayPal is not configured for this server", 400, origin);
    }

    // ── CRITICAL: Fetch authoritative product prices from DB ──────────────
    // Never trust client-supplied prices
    const productIds = cart_items.map((i: any) => String(i.product_id));
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select("id, name, price, numeric_id")
      .eq("server_id", server_id)
      .eq("enabled", true)
      .in("id", productIds);

    if (prodErr || !products || products.length === 0) {
      return jsonError("One or more products could not be found", 400, origin);
    }

    const productMap = new Map(products.map((p: any) => [String(p.id), p]));

    // Build verified cart using DB prices only
    const verifiedCart: Array<{ product_id: string; product_name: string; quantity: number; price: number }> = [];
    for (const item of cart_items) {
      const product = productMap.get(String(item.product_id));
      if (!product) {
        return jsonError(`Product ${item.product_id} not found or disabled`, 400, origin);
      }
      verifiedCart.push({
        product_id: String(item.product_id),
        product_name: String(product.name),
        quantity: Number(item.quantity),
        price: Number(product.price),
      });
    }

    // Calculate authoritative total from DB prices
    const total = verifiedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (total <= 0) {
      return jsonError("Order total must be greater than zero", 400, origin);
    }

    // Check basket limit
    if (gateway.basket_limit_enabled && gateway.basket_limit_amount && total > gateway.basket_limit_amount) {
      return jsonError(`Order total exceeds the basket limit of $${gateway.basket_limit_amount}`, 400, origin);
    }

    const { paypal_client_id, paypal_client_secret_enc, paypal_email, paypal_mode, instant_payments_only } = gateway;
    const baseUrl = paypal_mode === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

    // ── Get PayPal access token ───────────────────────────────────────────
    const authRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${paypal_client_id}:${paypal_client_secret_enc}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!authRes.ok) {
      console.error("PayPal auth error:", authRes.status);
      return jsonError("Payment provider authentication failed", 500, origin);
    }

    const { access_token } = await authRes.json();

    // ── Create PayPal order ───────────────────────────────────────────────
    const purchaseItems = verifiedCart.map((item) => ({
      name: item.product_name.substring(0, 127), // PayPal max length
      unit_amount: { currency_code: "USD", value: item.price.toFixed(2) },
      quantity: String(item.quantity),
    }));

    const idempotencyKey = `${server_id}-${username}-${Date.now()}`;

    const orderPayload = {
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: idempotencyKey.substring(0, 64),
        description: `In-game items - Non-Refundable`.substring(0, 127),
        custom_id: JSON.stringify({ server_id, username, customer_email: customer_email || "" }).substring(0, 127),
        payee: paypal_email ? { email_address: paypal_email } : undefined,
        amount: {
          currency_code: "USD",
          value: total.toFixed(2),
          breakdown: {
            item_total: { currency_code: "USD", value: total.toFixed(2) },
          },
        },
        items: purchaseItems,
      }],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: instant_payments_only ? "IMMEDIATE_PAYMENT_REQUIRED" : "UNRESTRICTED",
            locale: gateway.checkout_language || "en-US",
            shipping_preference: gateway.require_shipping_address ? "GET_FROM_FILE" : "NO_SHIPPING",
            user_action: "PAY_NOW",
          },
        },
      },
    };

    const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": idempotencyKey,
      },
      body: JSON.stringify(orderPayload),
    });

    if (!orderRes.ok) {
      console.error("PayPal order creation failed:", orderRes.status);
      return jsonError("Failed to create payment. Please try again.", 500, origin);
    }

    const order = await orderRes.json();

    // ── Store pending transaction with verified prices ─────────────────────
    await supabase.from("pending_transactions").insert({
      id: `tx-${Date.now()}`,
      server_id,
      username,
      cart_items: verifiedCart, // store verified cart, not client-supplied
      total,
      transaction_id: order.id,
      status: "pending",
      claimed: false,
      customer_email: customer_email || null,
      paypal_order_id: order.id,
      platform_fee: (total * 0.05).toFixed(2),
    });

    return new Response(JSON.stringify({
      order_id: order.id,
      paypal_client_id,
      paypal_mode,
    }), {
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });

  } catch (err) {
    // Log full error server-side, return generic message to client
    console.error("paypal-create-order error:", err instanceof Error ? err.message : err);
    return jsonError("An error occurred processing your order. Please try again.", 500, origin);
  }
});
