import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { LoaderCircle } from "lucide-react"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

export function LatestServersTicker() {
  const [servers, setServers] = useState<ToplistServer[]>([])

  useEffect(() => {
    let mounted = true

    toplistDataService.getNewestServers(6)
      .then((latest) => {
        if (mounted && latest.length > 0) setServers(latest)
      })
      .catch(() => {})

    return () => { mounted = false }
  }, [])

  const scrollingServers = [...servers, ...servers]

  return (
    <div className="h-8 overflow-hidden border-t border-violet-400/20 bg-card/90 text-xs backdrop-blur-sm">
      <div className="container mx-auto flex h-full items-center px-6">
        <div className="relative z-10 flex h-full shrink-0 items-center gap-1.5 border-r border-violet-400/25 bg-card pr-4 text-violet-200">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-violet-400" />
          <span className="font-bold uppercase tracking-[0.14em]">Latest Servers</span>
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">
          <div className="latest-servers-scroll flex w-max items-center gap-7 pl-7">
            {scrollingServers.map((server, index) => (
              <Link
                key={`${server.id}-${index}`}
                to={`/toplist/servers/${server.id}`}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap text-muted-foreground transition-colors hover:text-violet-200"
              >
                <span className="h-1.5 w-1.5 bg-violet-400 shadow-[0_0_7px_rgba(167,139,250,0.9)]" />
                <span className="font-medium text-foreground">{server.name}</span>
                <span className="text-[10px] uppercase tracking-wider">New listing</span>
              </Link>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-card to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent" />
        </div>
      </div>
    </div>
  )
}
