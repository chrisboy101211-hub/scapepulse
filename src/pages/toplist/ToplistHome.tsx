import { useState } from "react"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { Top10ServersList } from "@/components/toplist/Top10ServersList"
import { ServerList } from "@/components/toplist/ServerList"
import { SearchAndFilters } from "@/components/toplist/SearchAndFilters"
import { Ticker } from "@/components/toplist/Ticker"
import { SponsoredSlider } from "@/components/toplist/SponsoredSlider"
import { Logo } from "@/components/Logo"

export default function ToplistHome() {
  const [filters, setFilters] = useState({ search: "", revision: "", serverType: "" })

  return (
    <div className="min-h-screen bg-background">
      <ToplistHeader />
      <Ticker />

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Logo + tagline */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Logo size="lg" />
          </div>
          <p className="text-lg text-muted-foreground">
            The premier RuneScape Private Server community toplist
          </p>
        </div>

        {/* Sponsored server slider */}
        <SponsoredSlider />

        {/* Top 10 */}
        <Top10ServersList />

        {/* Search & Filters */}
        <SearchAndFilters onSearch={setFilters} />

        {/* Server List */}
        <ServerList filters={filters} />
      </div>

      <ToplistFooter />
    </div>
  )
}
