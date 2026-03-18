import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Rate limiting: max 10 capture attempts per order per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(key: string, max = 10, windowMs = 60_000): boolean {
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

    const { paypal_order_id, server_id } = body;

    // ── Input validation ──────────────────────────────────────────────────
    if (!paypal_order_id || typeof paypal_order_id !== "string" || !/^[A-Z0-9]{1,64}$/.test(paypal_order_id)) {
      return jsonError("Invalid order ID", 400, origin);
    }
    if (!server_id || typeof server_id !== "string" || server_id.length > 64) {
      return jsonError("Invalid server_id", 400, origin);
    }

    // ── Rate limiting ─────────────────────────────────────────────────────
    if (isRateLimited(`capture:${paypal_order_id}`)) {
      return jsonError("Too many capture attempts. Please wait.", 429, origin);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Verify the pending transaction exists and is in pending state ──────
    // This prevents double-capture attacks
    const { data: existingTx } = await supabase
      .from("pending_transactions")
      .select("id, status, total, cart_items, username")
      .eq("paypal_order_id", paypal_order_id)
      .eq("server_id", server_id)
      .single();

    if (!existingTx) {
      return jsonError("Order not found", 404, origin);
    }
    if (existingTx.status !== "pending") {
      // Already captured or cancelled — return success silently to avoid confusion
      return new Response(JSON.stringify({ success: true, already_processed: true }), {
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    // ── Fetch gateway config ──────────────────────────────────────────────
    const { data: gateway } = await supabase
      .from("server_payment_gateways")
      .select("paypal_client_id, paypal_client_secret_enc, paypal_mode")
      .eq("server_id", server_id)
      .eq("provider", "paypal")
      .single();

    if (!gateway) {
      return jsonError("Payment gateway not found", 400, origin);
    }

    const { paypal_client_id, paypal_client_secret_enc, paypal_mode } = gateway;
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

    // ── Capture the order ─────────────────────────────────────────────────
    const captureRes = await fetch(`${baseUrl}/v2/checkout/orders/${paypal_order_id}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      const errText = await captureRes.text();
      console.error("PayPal capture failed:", captureRes.status, errText.substring(0, 200));
      return jsonError("Payment capture failed. Please contact support if funds were deducted.", 500, origin);
    }

    const captureData = await captureRes.json();
    const captureUnit = captureData.purchase_units?.[0];
    const captureId = captureUnit?.payments?.captures?.[0]?.id;
    const captureStatus = captureUnit?.payments?.captures?.[0]?.status;
    const amountStr = captureUnit?.payments?.captures?.[0]?.amount?.value || "0";
    const totalAmount = Number(amountStr);

    if (captureStatus !== "COMPLETED") {
      console.error("Unexpected PayPal capture status:", captureStatus);
      return jsonError("Payment was not completed by PayPal", 400, origin);
    }

    // ── Atomic status update: only update if still in pending state ────────
    // This prevents race conditions — if two capture requests arrive simultaneously,
    // only the first one will match the eq("status", "pending") filter
    const { data: updatedTxRows, error: updateErr } = await supabase
      .from("pending_transactions")
      .update({ status: "paid", updated_at: new Date().toISOString() })
      .eq("paypal_order_id", paypal_order_id)
      .eq("status", "pending") // atomic guard — only update once
      .select("id, cart_items, username");

    if (updateErr || !updatedTxRows || updatedTxRows.length === 0) {
      // Another request already processed this order
      console.warn("Duplicate capture attempt for order:", paypal_order_id);
      return new Response(JSON.stringify({ success: true, already_processed: true }), {
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      });
    }

    const tx = updatedTxRows[0];
    const platformFee = (totalAmount * 0.05).toFixed(2);

    // ── Record commission ─────────────────────────────────────────────────
    await supabase.from("platform_commissions").insert({
      id: `comm-${Date.now()}`,
      server_id,
      paypal_order_id,
      total_amount: totalAmount,
      commission_amount: Number(platformFee),
      status: "pending",
      created_at: new Date().toISOString(),
    }).catch((e: any) => console.error("Commission insert error:", e?.message));

    // ── Send confirmation email ───────────────────────────────────────────
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let cartItems: any[] = [];
    try {
      cartItems = Array.isArray(tx.cart_items) ? tx.cart_items
        : JSON.parse(typeof tx.cart_items === "string" ? tx.cart_items : "[]");
    } catch { /* ignore parse error */ }

    // Get customer_email from the custom_id field stored on the PayPal order
    let customerEmail = "";
    let username = tx.username || "";
    try {
      const customId = captureUnit?.custom_id;
      if (customId) {
        const parsed = JSON.parse(customId);
        customerEmail = parsed.customer_email || "";
      }
    } catch { /* ignore */ }

    if (resendKey && customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      const itemsList = cartItems.map((i: any) =>
        `<li>${Number(i.quantity)}x ${String(i.product_name).substring(0, 100)} — $${(Number(i.price) * Number(i.quantity)).toFixed(2)}</li>`
      ).join("") || "<li>In-game items</li>";

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ScapePulse <noreply@scapepulse.com>",
          to: [customerEmail],
          subject: `Payment Confirmed — $${totalAmount.toFixed(2)}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#e0e0e0;padding:30px;border-radius:8px;">
              <h1 style="color:#00fff0;font-size:24px;margin-bottom:8px;">Payment Confirmed</h1>
              <p style="font-size:13px;margin-bottom:20px;padding:12px;background:#ff000020;border-left:3px solid #ff4444;border-radius:4px;">
                <strong style="color:#ff6666;">This is a Non-Refundable payment for services that have been delivered.</strong>
              </p>
              <p>Hi <strong>${String(username).substring(0, 30)}</strong>,</p>
              <p>Your purchase has been confirmed. Here is your order summary:</p>
              <ul style="background:#0d0d1a;padding:16px 24px;border-radius:6px;border:1px solid #333;">
                ${itemsList}
              </ul>
              <div style="margin-top:16px;padding-top:16px;border-top:1px solid #333;">
                <strong>Total Paid: $${totalAmount.toFixed(2)} USD</strong>
              </div>
              <p style="color:#666;font-size:12px;margin-top:24px;">
                Your items will be delivered in-game. Contact server staff for support.<br>
                Reference: ${captureId || paypal_order_id}
              </p>
            </div>
          `,
        }),
      }).catch((e: any) => console.error("Email send error:", e?.message));
    }

    return new Response(JSON.stringify({
      success: true,
      capture_id: captureId,
      amount: totalAmount,
    }), {
      headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("paypal-capture-order error:", err instanceof Error ? err.message : err);
    return jsonError("An error occurred. If funds were deducted please contact support.", 500, origin);
  }
});
