import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dataService } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { ServerNav } from "@/components/ServerNav";
import { ShoppingCart, X, Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Product, Category, Server } from "@/lib/mock-data";

interface CartItem {
  product: Product;
  quantity: number;
}

const getSubdomain = () => {
  const hostname = window.location.hostname;

  // If it's the Vercel preview URL, check for subdomain
  if (hostname.includes("vercel.app")) {
    return null; // Let the /store/:slug route handle it
  }

  // For custom domain (scapepulse.com)
  const parts = hostname.split(".");

  // If we have 2+ parts and first part is not www, it's a subdomain
  if (parts.length >= 2) {
    const mainDomain = parts.slice(-2).join("."); // e.g., "scapepulse.com"
    if (mainDomain === "scapepulse.com" && parts[0] !== "www" && parts[0] !== "scapepulse") {
      return parts[0];
    }
  }
  return null;
};

const StoreFront = () => {
  const paramsSlug = useParams();
  const slugFromParams = paramsSlug.slug;
  const [server, setServer] = useState<Server | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [storeAccent, setStoreAccent] = useState("#a855f7");
  const [storeBg, setStoreBg] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [pillLogoUrl, setPillLogoUrl] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  // Checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutUsername, setCheckoutUsername] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [paypalMode, setPaypalMode] = useState<"sandbox" | "live">("live");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);

  const subdomain = getSubdomain();
  const slug = slugFromParams || subdomain;

  useEffect(() => {
    loadData();
  }, [slug]);

  const loadData = async () => {
    try {
      let serverData = null;

      if (slug) {
        serverData = await dataService.getServerBySlug(slug);
      } else {
        const servers = await dataService.getServers();
        serverData = servers[0] || null;
      }

      setServer(serverData);

      if (serverData) {
        const [categoriesData, productsData, themeData] = await Promise.all([
          dataService.getCategories(serverData.id),
          dataService.getProducts(serverData.id),
          dataService.getServerTheme(serverData.id),
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
        if (themeData) {
          setStoreAccent(themeData.theme_store_accent || "#a855f7");
          setStoreBg(themeData.theme_store_bg || null);
          setLogoUrl(themeData.logo_url || null);
          setPillLogoUrl(themeData.pill_logo_url || null);
        }
        // Check if server owner is premium
        if (serverData.user_id) {
          const { data: userData } = await supabase
            .from("users")
            .select("is_premium")
            .eq("id", serverData.user_id)
            .single();
          setIsPremium(userData?.is_premium ?? false);
        }
      }
    } catch (error) {
      console.error("Failed to load store data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load PayPal SDK and render buttons when order is created
  useEffect(() => {
    if (!paypalOrderId || !paypalClientId || !paypalContainerRef.current) return;

    // Remove any existing PayPal script
    const existing = document.getElementById("paypal-sdk");
    if (existing) existing.remove();
    if ((window as any).paypal) delete (window as any).paypal;

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD${paypalMode === "sandbox" ? "&debug=true" : ""}`;
    script.onload = () => {
      (window as any).paypal.Buttons({
        createOrder: () => paypalOrderId,
        onApprove: async () => {
          try {
            const { data, error } = await supabase.functions.invoke("paypal-capture-order", {
              body: { paypal_order_id: paypalOrderId, server_id: server!.id },
            });
            if (error || data?.error) {
              toast.error("Payment capture failed");
              return;
            }
            toast.success("Payment successful! Your items will be delivered in-game.");
            setCart([]);
            setCartOpen(false);
            setCheckoutOpen(false);
            setPaypalOrderId(null);
            setPaypalClientId(null);
            setCheckoutUsername("");
            setCheckoutEmail("");
          } catch {
            toast.error("Failed to complete payment");
          }
        },
        onError: (err: any) => {
          console.error("PayPal error:", err);
          toast.error("PayPal payment failed. Please try again.");
        },
        onCancel: () => {
          toast.info("Payment cancelled.");
        },
        style: { layout: "vertical", color: "blue", shape: "rect", label: "pay" },
      }).render("#paypal-button-container");
    };
    document.body.appendChild(script);

    return () => {
      const s = document.getElementById("paypal-sdk");
      if (s) s.remove();
    };
  }, [paypalOrderId, paypalClientId]);

  const initiateCheckout = async () => {
    if (!checkoutUsername.trim()) { toast.error("Please enter your in-game username"); return; }
    if (!checkoutEmail.trim()) { toast.error("Please enter your email address"); return; }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paypal-create-order", {
        body: {
          server_id: server!.id,
          cart_items: cart.map(i => ({
            product_id: i.product.id,
            product_name: i.product.name,
            quantity: i.quantity,
            price: i.product.price,
          })),
          username: checkoutUsername,
          customer_email: checkoutEmail,
        },
      });
      if (error || data?.error) {
        toast.error(data?.error || "Failed to create PayPal order");
        setCheckoutLoading(false);
        return;
      }
      setPaypalOrderId(data.order_id);
      setPaypalClientId(data.paypal_client_id);
      setPaypalMode(data.paypal_mode || "live");
    } catch {
      toast.error("Failed to initiate checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const clean = hex.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16) || 0;
    const g = parseInt(clean.slice(2, 4), 16) || 0;
    const b = parseInt(clean.slice(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Server not found</h1>
          <p className="text-muted-foreground mt-2">The server you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) return prev.map((i) => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((i) => i.product.id !== productId));
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => prev.map((i) => {
      if (i.product.id !== productId) return i;
      const newQty = i.quantity + delta;
      return newQty <= 0 ? i : { ...i, quantity: newQty };
    }));
  };

  const cartTotal = cart.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-background" style={storeBg ? { backgroundColor: storeBg } : {}}>
      {/* Store Nav */}
      <ServerNav
        serverName={server.name}
        serverSlug={server.slug}
        logoUrl={logoUrl}
        pillLogoUrl={pillLogoUrl}
        isPremium={isPremium}
        accentColor={storeAccent}
        bgColor={storeBg}
        showCart={true}
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <div className="container mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-8 rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="font-display text-3xl font-bold">{server.name} Store</h1>
          <p className="mt-2 text-muted-foreground">{server.description}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full animate-pulse-glow" style={{ backgroundColor: storeAccent }} />
            <span className="text-sm" style={{ color: storeAccent }}>{server.players_online} players online</span>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-[0_0_25px_hsl(var(--primary)/0.08)]"
            >
              <div className="mb-3 text-center text-4xl">{product.image}</div>
              <h3 className="font-display font-semibold">{product.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-display text-xl font-bold" style={{ color: storeAccent }}>${Number(product.price).toFixed(2)}</span>
                <Button variant="hero" size="sm" onClick={() => addToCart(product)}>
                  Add to Cart
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-border bg-card"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-border p-4">
                  <h2 className="font-display text-lg font-bold">Cart ({cartCount})</h2>
                  <Button variant="ghost" size="icon" onClick={() => setCartOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">Your cart is empty</p>
                  ) : (
                    cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <span className="text-2xl">{item.product.image}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">${Number(item.product.price).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(item.product.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-border p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-display font-bold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground text-center px-2">
                      A 5% platform fee is included. <span className="text-destructive font-medium">Non-Refundable.</span>
                    </div>
                    <Button
                      variant="hero"
                      className="w-full"
                      onClick={() => setCheckoutOpen(true)}
                    >
                      Checkout — ${cartTotal.toFixed(2)}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => { if (!paypalOrderId) setCheckoutOpen(false); }}
          />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg">Checkout</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setCheckoutOpen(false);
                  setPaypalOrderId(null);
                  setPaypalClientId(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Order summary */}
            <div className="rounded-lg bg-secondary/40 p-3 space-y-1.5 text-sm">
              {cart.map(i => (
                <div key={i.product.id} className="flex justify-between">
                  <span className="text-muted-foreground">{i.quantity}x {i.product.name}</span>
                  <span>${(Number(i.product.price) * i.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border/40 pt-1.5 flex justify-between font-semibold">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
              This is a Non-Refundable payment for services that have been delivered.
            </p>

            {!paypalOrderId ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">In-Game Username</label>
                  <Input
                    value={checkoutUsername}
                    onChange={e => setCheckoutUsername(e.target.value)}
                    placeholder="YourUsername"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Email Address (for receipt)</label>
                  <Input
                    type="email"
                    value={checkoutEmail}
                    onChange={e => setCheckoutEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-9 text-sm"
                  />
                </div>
                <Button
                  className="w-full bg-[#003087] hover:bg-[#002070] text-white"
                  onClick={initiateCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? "Loading..." : "Proceed to PayPal"}
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground text-center mb-3">Complete your payment with PayPal</p>
                <div ref={paypalContainerRef} id="paypal-button-container" className="min-h-[50px]" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreFront;
