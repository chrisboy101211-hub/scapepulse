import { useState } from "react"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { Top10ServersList } from "@/components/toplist/Top10ServersList"
import { ServerList } from "@/components/toplist/ServerList"
import { SearchAndFilters } from "@/components/toplist/SearchAndFilters"
import { Ticker } from "@/components/toplist/Ticker"
import { Logo } from "@/components/Logo"
import { AdvertisementSlot } from "@/components/toplist/AdvertisementSlot"
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

        {/* Top five sponsored advertisement placements. */}
        <div className="mb-8 space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-display text-lg font-bold">Top 5 Sponsored</h2><span className="text-xs text-muted-foreground">Monthly placements</span></div>
          {slotsForPlacement("sponsored").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} variant="sponsored" className="mx-auto h-auto w-full max-w-[728px] aspect-[728/90]" />)}
        </div>

        {/* Only the ranked toplist is flanked by the two side placements. */}
        <div className="grid gap-6 xl:grid-cols-[160px_minmax(0,1fr)_160px]">
          <aside className="hidden xl:block">
            {slotsForPlacement("side-banner").filter((slot) => slot.id === "side-left-1").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} className="sticky top-6 h-[600px] w-[160px]" />)}
          </aside>
          <div className="min-w-0">
            <Top10ServersList />
            <SearchAndFilters onSearch={setFilters} />
            <ServerList filters={filters} />
          </div>
          <aside className="hidden xl:block">
            {slotsForPlacement("side-banner").filter((slot) => slot.id === "side-right-1").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} className="sticky top-6 h-[600px] w-[160px]" />)}
          </aside>
        </div>
      </div>

      <ToplistFooter />
    </div>
  )
}
