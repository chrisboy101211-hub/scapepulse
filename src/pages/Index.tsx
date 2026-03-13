import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { dataService } from "@/lib/data";
import {
  ShoppingCart,
  Vote,
  Server,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  ChevronRight,
  Check,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Hosted Web Store",
    description: "A fully branded storefront on your own subdomain. Sell ranks, items, keys, and bundles.",
  },
  {
    icon: Vote,
    title: "Voting Rewards",
    description: "Reward players who vote for your server. Automatic delivery via API integration.",
  },
  {
    icon: Server,
    title: "Multi-Server Support",
    description: "Manage multiple game servers from a single dashboard. RSPS and Minecraft supported.",
  },
  {
    icon: Shield,
    title: "Secure API",
    description: "Each server gets a unique API key for reward delivery and purchase validation.",
  },
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Commands execute in-game the moment a purchase is confirmed. No manual steps.",
  },
  {
    icon: Globe,
    title: "Custom Subdomain",
    description: "Every server gets a unique subdomain. Your brand, your store, your way.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/forever",
    description: "Get started with one server",
    features: ["1 Game Server", "Basic Storefront", "Voting Support", "Standard API Access", "5% Platform Fee"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$20",
    period: "/month",
    description: "Scale with unlimited power",
    features: ["Up to 10 Servers", "Custom Store Branding", "Advanced Analytics", "Priority API Limits", "Reduced Platform Fee", "Early Access Features"],
    cta: "Go Premium",
    highlighted: true,
  },
];

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubdomain = async () => {
      const hostname = window.location.hostname;
      
      // Skip if it's a vercel app or localhost
      if (hostname.includes("vercel.app") || hostname === "localhost") {
        return;
      }
      
      const parts = hostname.split(".");
      
      // Check if this is a subdomain (not www, not the main domain itself)
      if (parts.length >= 2) {
        const mainDomain = parts.slice(-2).join(".");
        
        if (mainDomain === "scapepulse.com" && parts[0] !== "www" && parts[0] !== "scapepulse") {
          const subdomain = parts[0];
          
          // Check if this server exists in our database
          const server = await dataService.getServerBySlug(subdomain);
          if (server) {
            navigate(`/store/${subdomain}`);
          }
        }
      }
    };
    
    checkSubdomain();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
        </div>

        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Zap className="h-3.5 w-3.5" />
              Now supporting RSPS & Minecraft
            </div>
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Your Game Server
              <br />
              <span className="text-gradient">Deserves a Store</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Create a hosted donation store and voting reward system for your game server.
              Sell ranks, items, and more — delivered instantly in-game.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <Button variant="hero" size="lg" className="gap-2">
                  Create Your Store <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/store/oblivionpk">
                <Button variant="hero-outline" size="lg" className="gap-2">
                  View Demo Store <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mx-auto mt-20 grid max-w-3xl grid-cols-3 gap-8"
          >
            {[
              { value: "500+", label: "Active Servers" },
              { value: "$2M+", label: "Processed" },
              { value: "99.9%", label: "Uptime" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-3xl font-bold text-primary">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Everything You Need to <span className="text-gradient">Monetize</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built specifically for game server owners. No bloat, no compromises.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group rounded-lg border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-[0_0_30px_hsl(var(--primary)/0.08)]"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-border/50 py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Simple <span className="text-gradient">Pricing</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start free, upgrade when you need more.
            </p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className={`relative rounded-xl border p-8 ${
                  plan.highlighted
                    ? "border-primary/40 glow-border bg-card"
                    : "border-border/50 bg-card"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mt-4">
                    <span className="font-display text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-secondary-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button
                    variant={plan.highlighted ? "hero" : "outline"}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 py-24">
        <div className="container mx-auto px-6 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Ready to <span className="text-gradient">Launch</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Set up your store in minutes. No credit card required for the free plan.
          </p>
          <Link to="/register">
            <Button variant="hero" size="lg" className="mt-8 gap-2">
              Create Your Store <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 ScapePulse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
