import { useState } from "react"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { ServerList } from "@/components/toplist/ServerList"
import { SearchAndFilters } from "@/components/toplist/SearchAndFilters"
import { Ticker } from "@/components/toplist/Ticker"
import { Logo } from "@/components/Logo"
import { AdvertisementSlot } from "@/components/toplist/AdvertisementSlot"
import { ToplistSidePanel } from "@/components/toplist/ToplistSidePanel"
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

        {/* Three monthly banner placements above the toplist. */}
        <div className="mb-8 grid justify-items-center gap-3 md:grid-cols-3">
          {slotsForPlacement("top-banner").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} className="h-auto w-full max-w-[728px] aspect-[728/90]" />)}
        </div>

        {/* Server discovery panels fill the space alongside sponsored placements. */}
        <div className="mb-8 grid items-start gap-6 xl:grid-cols-[170px_minmax(0,1fr)_170px]">
          <ToplistSidePanel kind="votes" />
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold">Top 5 Sponsored</h2>
            {slotsForPlacement("sponsored").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} variant="sponsored" className="mx-auto h-auto w-full max-w-[728px] aspect-[728/90]" />)}
          </div>
          <ToplistSidePanel kind="newest" />
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
