import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Plus, Edit2, Trash2, ArrowLeft, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useServers } from "@/lib/server-context";
import { useAuth } from "@/lib/auth";

type View = "list" | "provider-select" | "paypal-setup";

interface Gateway {
  id: string;
  server_id: string;
  provider: string;
  paypal_client_id?: string;
  paypal_client_secret_enc?: string;
  paypal_email?: string;
  paypal_mode?: string;
  checkout_language?: string;
  require_shipping_address?: boolean;
  hidden?: boolean;
  verified_addresses_only?: boolean;
  verified_paypal_accounts_only?: boolean;
  basket_limit_enabled?: boolean;
  basket_limit_amount?: number;
  instant_payments_only?: boolean;
  enabled?: boolean;
  updated_at?: string;
}

const CHECKOUT_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "it", label: "Italian" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
];

export default function PaymentMethods() {
  const { selectedServer } = useServers();
  const { user } = useAuth();
  const [view, setView] = useState<View>("list");
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);

  // PayPal form state
  const [ppClientId, setPpClientId] = useState("");
  const [ppClientSecret, setPpClientSecret] = useState("");
  const [ppEmail, setPpEmail] = useState("");
  const [ppMode, setPpMode] = useState<"sandbox" | "live">("live");
  const [ppLanguage, setPpLanguage] = useState("en");
  const [ppRequireShipping, setPpRequireShipping] = useState(false);
  const [ppHidden, setPpHidden] = useState(false);
  const [ppVerifiedAddresses, setPpVerifiedAddresses] = useState(false);
  const [ppVerifiedAccounts, setPpVerifiedAccounts] = useState(false);
  const [ppBasketLimit, setPpBasketLimit] = useState(false);
  const [ppBasketLimitAmount, setPpBasketLimitAmount] = useState("");
  const [ppInstantOnly, setPpInstantOnly] = useState(false);

  useEffect(() => {
    if (selectedServer) loadGateways();
  }, [selectedServer]);

  const loadGateways = async () => {
    if (!selectedServer) return;
    setLoading(true);
    const { data } = await supabase
      .from("server_payment_gateways")
      .select("*")
      .eq("server_id", selectedServer.id);
    setGateways(data || []);
    setLoading(false);
  };

  const openEdit = (gw: Gateway) => {
    setEditingGateway(gw);
    if (gw.provider === "paypal") {
      setPpClientId(gw.paypal_client_id || "");
      setPpClientSecret(""); // don't pre-fill secret for security
      setPpEmail(gw.paypal_email || "");
      setPpMode((gw.paypal_mode as "sandbox" | "live") || "live");
      setPpLanguage(gw.checkout_language || "en");
      setPpRequireShipping(gw.require_shipping_address ?? false);
      setPpHidden(gw.hidden ?? false);
      setPpVerifiedAddresses(gw.verified_addresses_only ?? false);
      setPpVerifiedAccounts(gw.verified_paypal_accounts_only ?? false);
      setPpBasketLimit(gw.basket_limit_enabled ?? false);
      setPpBasketLimitAmount(String(gw.basket_limit_amount || ""));
      setPpInstantOnly(gw.instant_payments_only ?? false);
    }
    setView("paypal-setup");
  };

  const resetPayPalForm = () => {
    setEditingGateway(null);
    setPpClientId(""); setPpClientSecret(""); setPpEmail(""); setPpMode("live");
    setPpLanguage("en"); setPpRequireShipping(false); setPpHidden(false);
    setPpVerifiedAddresses(false); setPpVerifiedAccounts(false);
    setPpBasketLimit(false); setPpBasketLimitAmount(""); setPpInstantOnly(false);
  };

  const savePayPal = async () => {
    if (!selectedServer) return;
    if (!ppClientId.trim()) { toast.error("Client ID is required"); return; }
    if (!editingGateway && !ppClientSecret.trim()) { toast.error("Client Secret is required"); return; }
    if (!ppEmail.trim()) { toast.error("PayPal email is required"); return; }

    setSaving(true);
    try {
      const payload: any = {
        server_id: selectedServer.id,
        provider: "paypal",
        paypal_client_id: ppClientId.trim(),
        paypal_email: ppEmail.trim(),
        paypal_mode: ppMode,
        checkout_language: ppLanguage,
        require_shipping_address: ppRequireShipping,
        hidden: ppHidden,
        verified_addresses_only: ppVerifiedAddresses,
        verified_paypal_accounts_only: ppVerifiedAccounts,
        basket_limit_enabled: ppBasketLimit,
        basket_limit_amount: ppBasketLimit && ppBasketLimitAmount ? Number(ppBasketLimitAmount) : null,
        instant_payments_only: ppInstantOnly,
        enabled: true,
      };
      if (ppClientSecret.trim()) {
        payload.paypal_client_secret_enc = ppClientSecret.trim();
      }

      if (editingGateway) {
        await supabase.from("server_payment_gateways").update(payload).eq("id", editingGateway.id);
        toast.success("PayPal settings updated");
      } else {
        await supabase.from("server_payment_gateways").insert(payload);
        toast.success("PayPal connected successfully");
      }
      await loadGateways();
      resetPayPalForm();
      setView("list");
    } catch (err) {
      toast.error("Failed to save PayPal configuration");
    } finally {
      setSaving(false);
    }
  };

  const deleteGateway = async (id: string) => {
    if (!confirm("Remove this payment method?")) return;
    await supabase.from("server_payment_gateways").delete().eq("id", id);
    toast.success("Payment method removed");
    await loadGateways();
  };

  if (!selectedServer) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Select a server to manage payment methods.
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="p-6 max-w-3xl space-y-6">
        {/* Header card */}
        <div className="rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-border/40 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display">Payment Methods</h1>
                <p className="text-sm text-muted-foreground">Connect and manage how your store accepts payments.</p>
              </div>
            </div>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              onClick={() => setView("provider-select")}
            >
              <Plus className="h-4 w-4" />
              Add method
            </Button>
          </div>
          {gateways.length > 0 && (
            <div className="mt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 py-1 text-sm">
                <CreditCard className="h-3.5 w-3.5 text-primary" />
                <span className="font-medium">Configured</span>
                <span className="text-muted-foreground">· {gateways.length}</span>
              </span>
            </div>
          )}
        </div>

        {/* Gateways list */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Manage Payment Methods</span>
            </div>
            <span className="text-xs text-muted-foreground">Edit, disable, or remove gateways</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
          ) : gateways.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No payment methods configured yet.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setView("provider-select")}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Add your first method
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {gateways.map((gw) => (
                <div key={gw.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <CreditCard className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm capitalize">{gw.provider}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Updated · {gw.updated_at ? new Date(gw.updated_at).toLocaleString() : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-400" />
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(gw)}>
                      <Edit2 className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-destructive hover:bg-destructive/10 border-destructive/30"
                      onClick={() => deleteGateway(gw.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform fee notice */}
        <p className="text-xs text-muted-foreground text-center">
          A 5% platform fee applies to all transactions. This is automatically tracked and reconciled.
        </p>
      </div>
    );
  }

  // ── PROVIDER SELECTOR ──────────────────────────────────────────────────
  if (view === "provider-select") {
    const providers = [
      { id: "paypal", name: "PayPal", desc: "Accept PayPal and cards globally", color: "#003087", available: true },
      { id: "stripe", name: "Stripe", desc: "Recommended · Fast onboarding", color: "#635bff", available: false, recommended: true },
      { id: "coinbase", name: "Coinbase Commerce", desc: "Accept crypto: BTC, ETH and more", color: "#0052ff", available: false },
    ];

    return (
      <div className="p-6 max-w-3xl space-y-6">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-border/40 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-display">Add Payment Method</h1>
                <p className="text-sm text-muted-foreground">Choose a provider to start accepting payments in your store.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setView("list")}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/50 px-3 py-1 text-sm">
              <CreditCard className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">Available</span>
              <span className="text-muted-foreground">· {providers.length}</span>
            </span>
          </div>
        </div>

        {/* Providers */}
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <span className="font-semibold text-sm">Providers</span>
            <span className="text-xs text-muted-foreground">Pick a provider to configure</span>
          </div>
          <div className="divide-y divide-border/40">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-xs font-bold"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </div>
                <Button
                  variant={p.recommended ? "default" : "outline"}
                  size="sm"
                  className={p.recommended ? "bg-primary text-primary-foreground" : ""}
                  disabled={!p.available}
                  onClick={() => p.available && setView("paypal-setup")}
                >
                  {p.available ? "Select" : "Coming Soon"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── PAYPAL SETUP ───────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display flex items-center gap-2">
            <span className="text-2xl font-black" style={{ color: "#003087" }}>P</span>
            PayPal
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Accept PayPal and cards in minutes. Simple or advanced mode.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { resetPayPalForm(); setView(editingGateway ? "list" : "provider-select"); }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* About card */}
        <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
          <h3 className="font-semibold text-sm flex items-center gap-1.5">
            <span className="text-muted-foreground">ⓘ</span> About
            <span className="ml-auto text-xs text-primary cursor-pointer hover:underline">Overview and links</span>
          </h3>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-black" style={{ color: "#003087" }}>P</span>
              <div>
                <span className="text-2xl font-black" style={{ color: "#003087" }}>Pay</span>
                <span className="text-2xl font-black" style={{ color: "#009cde" }}>Pal</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Accept credit cards and PayPal in 25 currencies from over 202 countries. Paypal is a world-wide leader in online payments. Start accepting payments in minutes and grow your business the way you want to.
            </p>
          </div>
          <div className="divide-y divide-border/40 border border-border/40 rounded-lg overflow-hidden text-sm">
            <div className="grid grid-cols-2 gap-2 px-3 py-2">
              <span className="text-muted-foreground">Getting Started</span>
              <span>Quickly - No Applications</span>
            </div>
            <div className="grid grid-cols-2 gap-2 px-3 py-2">
              <span className="text-muted-foreground">Website</span>
              <a href="https://paypal.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://paypal.com</a>
            </div>
          </div>
        </div>

        {/* Setup card */}
        <div className="rounded-xl border border-border/40 bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">🔧 Setup</h3>
            <div className="flex rounded-lg border border-border/60 overflow-hidden text-xs">
              <span className="px-3 py-1.5 bg-primary text-primary-foreground font-medium">Simple</span>
              <span className="px-3 py-1.5 text-muted-foreground">Advanced</span>
            </div>
          </div>

          {/* Credentials */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">PayPal Client ID <span className="text-destructive">*</span></Label>
              <Input
                value={ppClientId}
                onChange={e => setPpClientId(e.target.value)}
                placeholder="AaBbCc..."
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                PayPal Client Secret{" "}
                <span className="text-destructive">
                  {editingGateway ? "(leave blank to keep existing)" : "*"}
                </span>
              </Label>
              <Input
                type="password"
                value={ppClientSecret}
                onChange={e => setPpClientSecret(e.target.value)}
                placeholder={editingGateway ? "••••••••" : "EeFfGg..."}
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">PayPal Business Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                value={ppEmail}
                onChange={e => setPpEmail(e.target.value)}
                placeholder="you@business.com"
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mode</Label>
              <Select value={ppMode} onValueChange={(v) => setPpMode(v as "sandbox" | "live")}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="live">Live (Production)</SelectItem>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Checkout Language */}
          <div className="space-y-1.5">
            <Label className="text-xs">Checkout Language</Label>
            <Select value={ppLanguage} onValueChange={setPpLanguage}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHECKOUT_LANGUAGES.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">The language to display on checkout</p>
          </div>

          {/* Checkboxes */}
          <div className="space-y-2.5">
            {[
              { label: "Require a shipping address", value: ppRequireShipping, setter: setPpRequireShipping },
              { label: "Hide this gateway from the store", value: ppHidden, setter: setPpHidden },
              { label: "Only accept payments from verified addresses", value: ppVerifiedAddresses, setter: setPpVerifiedAddresses },
              { label: "Only accept payments from verified Paypal accounts", value: ppVerifiedAccounts, setter: setPpVerifiedAccounts },
              { label: "Set a basket limit for this payment method", value: ppBasketLimit, setter: setPpBasketLimit },
              { label: "Only allow instant payments (disable e-check)", value: ppInstantOnly, setter: setPpInstantOnly },
            ].map(({ label, value, setter }) => (
              <div key={label} className="flex items-center gap-2.5">
                <Switch
                  checked={value}
                  onCheckedChange={setter}
                  className="scale-90"
                />
                <label className="text-xs text-foreground/80 cursor-pointer" onClick={() => setter(!value)}>{label}</label>
              </div>
            ))}
            {ppBasketLimit && (
              <div className="ml-8 space-y-1">
                <Label className="text-xs text-muted-foreground">Basket limit amount ($)</Label>
                <Input
                  type="number"
                  value={ppBasketLimitAmount}
                  onChange={e => setPpBasketLimitAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className="h-8 text-sm w-32"
                />
              </div>
            )}
          </div>

          <Button
            className="w-full bg-[#003087] hover:bg-[#002070] text-white"
            onClick={savePayPal}
            disabled={saving}
          >
            {saving ? "Saving..." : editingGateway ? "Update PayPal Settings" : "Submit and Connect with Paypal"}
          </Button>
        </div>
      </div>
    </div>
  );
}
