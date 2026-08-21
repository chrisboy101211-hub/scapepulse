import { Link } from "react-router-dom"
import { Check, Crown, Megaphone, CalendarClock } from "lucide-react"
import NavBar from "@/components/NavBar"
import { Button } from "@/components/ui/button"
import { TOPLIST_PREMIUM_PRICE, advertisementSlots, slotsForPlacement } from "@/lib/advertising"

const placementLabels = {
  "top-banner": "Top banner placements",
  sponsored: "Top 5 sponsored placements",
  "side-banner": "Side banner placements",
}

export default function Advertising() {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="container mx-auto max-w-6xl px-6 py-16">
        <section className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Megaphone className="h-3.5 w-3.5" /> Monthly visibility packages
          </div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">Advertisement <span className="text-gradient">that gets seen</span></h1>
          <p className="mt-4 text-lg text-muted-foreground">Reserve premium visibility on the ScapePulse toplist. Every placement is sold on a monthly cadence.</p>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
          <div className="rounded-2xl border border-primary/40 bg-card p-7 glow-border">
            <div className="flex items-center gap-2 text-primary"><Crown className="h-5 w-5" /><span className="text-sm font-semibold">Toplist Premium</span></div>
            <h2 className="mt-4 font-display text-2xl font-bold">Premium glow</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Make your server stand out directly in the toplist with a premium visual glow.</p>
            <div className="mt-6"><span className="font-display text-4xl font-bold">${TOPLIST_PREMIUM_PRICE}</span><span className="text-muted-foreground"> USD / month</span></div>
            <ul className="mt-6 space-y-2 text-sm text-secondary-foreground">
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /> Recurring monthly premium placement</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /> Premium glow in the toplist</li>
              <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" /> Your existing server listing stays in place</li>
            </ul>
            <Button variant="hero" className="mt-7 w-full" asChild><Link to="/register">Get Toplist Premium</Link></Button>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-7">
            <div className="flex items-center gap-2 text-primary"><Megaphone className="h-5 w-5" /><span className="text-sm font-semibold">Banner spots</span></div>
            <h2 className="mt-4 font-display text-2xl font-bold">Advertisement inventory</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Live availability is shared with the toplist placeholders below. Reserved placements show their next monthly availability date.</p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/45 p-3"><p className="font-display text-2xl font-bold">{advertisementSlots.length}</p><p className="text-xs text-muted-foreground">Total spots</p></div>
              <div className="rounded-lg bg-emerald-500/10 p-3"><p className="font-display text-2xl font-bold text-emerald-300">{advertisementSlots.filter((slot) => slot.status === "available").length}</p><p className="text-xs text-muted-foreground">Available now</p></div>
              <div className="rounded-lg bg-muted/45 p-3"><p className="font-display text-2xl font-bold">Monthly</p><p className="text-xs text-muted-foreground">Renewal period</p></div>
            </div>
          </div>
        </section>

        <section className="mt-14 space-y-8">
          <div><h2 className="font-display text-2xl font-bold">Banner availability</h2><p className="mt-1 text-sm text-muted-foreground">All banner sizes are consistent within each placement type and renew monthly.</p></div>
          {(Object.keys(placementLabels) as Array<keyof typeof placementLabels>).map((placement) => (
            <div key={placement} className="rounded-2xl border border-border/50 bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-lg font-bold">{placementLabels[placement]}</h3>
                <span className="border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">${slotsForPlacement(placement)[0]?.priceUsd ?? 0} USD / month</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {slotsForPlacement(placement).map((slot) => {
                  const available = slot.status === "available"
                  return <div key={slot.id} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-2"><span className="font-medium">{slot.name}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${available ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{available ? "Available" : "Reserved"}</span></div>
                    <p className="mt-2 text-lg font-bold text-foreground">${slot.priceUsd} <span className="text-xs font-medium text-muted-foreground">USD / month</span></p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> {slot.availableOn} · {slot.cadence}</p>
                  </div>
                })}
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
