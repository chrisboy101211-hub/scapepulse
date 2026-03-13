import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { dataService } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { ShoppingCart, X, Plus, Minus, Loader2, Users } from "lucide-react";
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
  const location = useLocation();
  const slugFromParams = paramsSlug.slug;
  const [server, setServer] = useState<Server | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

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
        const [categoriesData, productsData] = await Promise.all([
          dataService.getCategories(serverData.id),
          dataService.getProducts(serverData.id)
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
      }
    } catch (error) {
      console.error("Failed to load store data:", error);
    } finally {
      setLoading(false)
    }
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
    <div className="min-h-screen bg-background">
      {/* Store Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
            <span className="font-display font-bold">{server.name}</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs uppercase text-secondary-foreground">{server.game_type}</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setCartOpen(true)} className="relative gap-2">
              <ShoppingCart className="h-4 w-4" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Hero */}
        <div className="mb-8 rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="font-display text-3xl font-bold">{server.name} Store</h1>
          <p className="mt-2 text-muted-foreground">{server.description}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse-glow" />
            <span className="text-sm text-neon-green">{server.players_online} players online</span>
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
          {mockCategories.map((cat) => (
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
                <span className="font-display text-xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
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
                    <Button 
                      variant="hero" 
                      className="w-full" 
                      onClick={async () => {
                        if (!server) return;
                        const username = prompt("Enter your in-game username:");
                        if (!username) return;
                        
                        try {
                          const order = await dataService.createOrder({
                            server_id: server.id,
                            username,
                            status: "pending",
                            total: cartTotal,
                          });
                          
                          for (const item of cart) {
                            await supabase.from("order_items").insert({
                              id: `oi-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                              order_id: order.id,
                              product_id: item.product.id,
                              product_name: item.product.name,
                              quantity: item.quantity,
                              price: Number(item.product.price),
                            });
                          }
                          
                          toast.success(`Order #${order.id.slice(-8)} created!`);
                          setCart([]);
                          setCartOpen(false);
                        } catch (error) {
                          console.error("Order error:", error);
                          toast.error("Failed to create order");
                        }
                      }}
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
    </div>
  );
};

export default StoreFront;
