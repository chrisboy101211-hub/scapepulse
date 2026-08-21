import { useState } from "react"
import { Link } from "react-router-dom"
import { ListOrdered, MessageCircle, ShoppingBag } from "lucide-react"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { ServerList } from "@/components/toplist/ServerList"
import { SearchAndFilters } from "@/components/toplist/SearchAndFilters"
import { Ticker } from "@/components/toplist/Ticker"
import { Logo } from "@/components/Logo"
import { AdvertisementSlot } from "@/components/toplist/AdvertisementSlot"
import { ToplistSidePanel } from "@/components/toplist/ToplistSidePanel"
import { ServerOfTheDayWidget, ServerOfTheMonth } from "@/components/toplist/FeaturedServerWidget"
import { slotsForPlacement } from "@/lib/advertising"

export default function ToplistHome() {
  const [filters, setFilters] = useState({ search: "", revision: "", serverType: "" })

  return (
    <div className="min-h-screen bg-background">
      <ToplistHeader />
      <Ticker />

      <div className="container mx-auto max-w-[1440px] px-6 py-8">
        {/* Logo + tagline */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <p className="text-lg text-muted-foreground">
            The premier RuneScape Private Server community toplist
          </p>
        </div>

        <div className="mb-5 flex justify-center">
          <ServerOfTheMonth />
        </div>

        <section className="mb-8 overflow-hidden border border-border/60 bg-card/55 shadow-lg shadow-black/10 backdrop-blur-sm">
          <div className="grid gap-6 px-6 py-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-9">
            <div className="max-w-3xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">Welcome to ScapePulse</p>
              <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">What is ScapePulse?</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground md:text-base">
                ScapePulse is all-in-one RSPS software for discovering servers through the Toplist, sharing content in the Video Hub, and running server storefronts.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
              <Link to="/storefront" className="inline-flex items-center justify-center gap-2 border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 transition-colors hover:bg-violet-500/20">
                <ShoppingBag className="h-4 w-4" /> Storefronts
              </Link>
              <Link to="/toplist" className="inline-flex items-center justify-center gap-2 border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/20">
                <ListOrdered className="h-4 w-4" /> Toplist
              </Link>
              <a href="https://discord.gg/h2h8RSa2sr" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 border border-blue-400/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20">
                <MessageCircle className="h-4 w-4" /> Discord
              </a>
            </div>
          </div>
        </section>

        {/* Three monthly banner placements above the toplist. */}
        <div className="mb-8 grid justify-items-center gap-3 md:grid-cols-3">
          {slotsForPlacement("top-banner").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} className="h-auto w-full max-w-[728px] aspect-[728/90]" />)}
        </div>

        {/* Server discovery panels fill the space alongside sponsored placements. */}
        <div className="mb-8 grid items-center gap-6 xl:grid-cols-[200px_minmax(0,1fr)_200px]">
          <ToplistSidePanel kind="votes" />
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Top 5 Sponsored</h2>
            {slotsForPlacement("sponsored").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} variant="sponsored" className="mx-auto h-auto w-full max-w-[728px] aspect-[728/90]" />)}
          </div>
          <div className="space-y-3">
            <ToplistSidePanel kind="newest" />
            <ServerOfTheDayWidget />
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4" aria-label="Toplist starts here">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-primary/45" />
          <div className="flex items-center gap-2 border border-primary/35 bg-primary/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.16em] text-primary">
            <ListOrdered className="h-4 w-4" /> Toplist
            <span className="text-[10px] font-medium tracking-[0.1em] text-muted-foreground">Rankings begin</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-primary/45" />
        </div>

        {/* Only the ranked toplist is flanked by the two side placements. */}
        <div className="grid gap-6 xl:grid-cols-[160px_minmax(0,1fr)_160px]">
          <aside className="hidden xl:block">
            {slotsForPlacement("side-banner").filter((slot) => slot.id === "side-left-1").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} orientation="vertical" className="sticky top-6 h-[600px] w-[160px]" />)}
          </aside>
          <div className="min-w-0">
            <SearchAndFilters onSearch={setFilters} />
            <ServerList filters={filters} />
          </div>
          <aside className="hidden xl:block">
            {slotsForPlacement("side-banner").filter((slot) => slot.id === "side-right-1").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} orientation="vertical" className="sticky top-6 h-[600px] w-[160px]" />)}
          </aside>
        </div>
      </div>

      <ToplistFooter />
    </div>
  )
}
