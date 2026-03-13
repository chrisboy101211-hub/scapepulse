import { Link } from "react-router-dom"
import NavBar from "@/components/NavBar"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for getting started",
      features: [
        "1 Game Server",
        "Basic Storefront",
        "Voting Support",
        "Standard API Access",
        "5% Platform Fee",
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Premium",
      price: "$20",
      period: "month",
      description: "For serious server owners",
      features: [
        "Unlimited Servers",
        "Custom Store Branding",
        "Advanced Analytics",
        "Higher API Limits",
        "Priority Support",
        "No Platform Fee",
      ],
      cta: "Coming Soon",
      highlighted: true,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl font-bold mb-4">
            Simple, Transparent <span className="text-gradient">Pricing</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {plans.map((plan) => (
            <div
              key={plan.name}
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
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
              </div>
              <ul className="mb-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-secondary-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link to="/register">
                <Button
                  variant={plan.highlighted ? "hero" : "outline"}
                  className="w-full"
                  disabled={plan.highlighted}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Pricing
