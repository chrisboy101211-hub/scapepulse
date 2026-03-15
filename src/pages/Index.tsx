import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";
import { dataService } from "@/lib/data";
import { SponsoredSlider } from "@/components/toplist/SponsoredSlider";
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
  CreditCard,
  BarChart3,
  Plug,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Custom Storefront",
    description: "A branded storefront on your own subdomain. Sell ranks, items, keys, and bundles that match your server.",
  },
  {
    icon: Zap,
    title: "Automated Delivery",
    description: "Items and ranks are delivered automatically in-game the moment payment is confirmed. No manual work required.",
  },
  {
    icon: Vote,
    title: "Voting Rewards",
    description: "Incentivize server votes with automatic rewards. Players vote, you reward — automatically.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Accept PayPal and card payments with built-in fraud protection. Your revenue is protected.",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    description: "Track revenue, top products, and player purchases. Make informed decisions with real data.",
  },
  {
    icon: Plug,
    title: "API Integration",
    description: "Simple API for connecting to your game server. Works with RSPS, Minecraft, and more.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Create Your Account",
    description: "Sign up in under a minute. No credit card required to get started.",
  },
  {
    step: "2",
    title: "Add Your Server",
    description: "Connect your game server and configure your store settings.",
  },
  {
    step: "3",
    title: "Set Up Products",
    description: "Add ranks, items, and packages with your prices and delivery commands.",
  },
  {
    step: "4",
    title: "Start Selling",
    description: "Open your store and begin accepting payments from your community.",
  },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/forever",
    description: "Perfect for getting started",
    features: ["1 Game Server", "Basic Storefront", "Voting System", "API Access", "5% Platform Fee"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "$20",
    period: "/month",
    description: "For growing communities",
    features: ["Up to 10 Servers", "Custom Branding", "Advanced Analytics", "Priority Support", "3% Platform Fee", "Early Access"],
    cta: "Go Premium",
    highlighted: true,
  },
];

const faqs = [
  {
    question: "How quickly can I start selling?",
    answer: "You can launch your store and start accepting payments in about 15-30 minutes. Our setup process is straightforward with clear guides.",
  },
  {
    question: "What payment methods are supported?",
    answer: "We support PayPal and Stripe, allowing players to pay with credit cards, debit cards, and PayPal balances.",
  },
  {
    question: "How does automatic delivery work?",
    answer: "When a purchase is completed, our system sends commands directly to your game server to deliver items or ranks instantly.",
  },
  {
    question: "Is there a free trial?",
    answer: "The Free plan has no time limit. You can use it indefinitely to sell and grow your server community.",
  },
  {
    question: "What fees do you charge?",
    answer: "We charge a 5% platform fee on all transactions. The Free plan includes this 5% fee, while Premium ($20/month) reduces it to 3%. No other hidden fees.",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_servers: 0, total_revenue: 0, total_transactions: 0, uptime_percentage: 99.9 });
  const [loadingStats, setLoadingStats] = useState(true);

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

    const loadStats = async () => {
      try {
        const statsData = await dataService.getPlatformStats();
        setStats(statsData);
      } catch (e) {
        console.error("Failed to load stats:", e);
      } finally {
        setLoadingStats(false);
      }
    };
    
    checkSubdomain();
    loadStats();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

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
            <SponsoredSlider />
            
            <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Monetize Your Server
              <br />
              <span className="text-gradient">Without the Complexity</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              A hosted donation store that integrates with your game server. 
              Accept payments, deliver items automatically, and grow your community.
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

          {/* Stats - loaded from database */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-8"
          >
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">
                {loadingStats ? "..." : stats.total_servers}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Active Servers</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">
                {loadingStats ? "..." : `$${(stats.total_revenue / 1000).toFixed(0)}K`}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-bold text-primary">
                {loadingStats ? "..." : `${stats.uptime_percentage}%`}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">Uptime</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/50 py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Get Started in <span className="text-gradient">4 Steps</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Launch your store and start accepting payments quickly.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {step.step}
                </div>
                <h3 className="font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 py-24">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">
              Everything You Need to <span className="text-gradient">Sell Online</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Built for game server owners. Set up in minutes, no coding required.
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

      {/* FAQ & Pricing */}
      <section className="border-t border-border/50 py-24">
        <div className="container mx-auto px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* FAQ */}
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl mb-8">
                Frequently Asked <span className="text-gradient">Questions</span>
              </h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.question} className="rounded-lg border border-border bg-card p-6">
                    <h3 className="font-display font-semibold">{faq.question}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl mb-8">
                Simple <span className="text-gradient">Pricing</span>
              </h2>
              <div className="grid gap-6">
                {pricingPlans.map((plan, i) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className={`relative rounded-xl border p-6 ${
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
                    <div className="mb-4">
                      <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
                      <div className="mt-3">
                        <span className="font-display text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                    </div>
                    <ul className="mb-6 space-y-2">
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
