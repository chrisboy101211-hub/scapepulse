import { useEffect, useState } from "react"
import { MessageCircle, Play, Star } from "lucide-react"
import { Link } from "react-router-dom"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

function useFeaturedServer() {
  const [server, setServer] = useState<ToplistServer | null>(null)

  useEffect(() => {
    toplistDataService.getServer(158).then(setServer).catch(() => setServer(null))
  }, [])

  return server
}

export function ServerOfTheDayWidget() {
  const server = useFeaturedServer()

  if (!server) {
    return <section className="min-h-[248px] animate-pulse border border-border/70 bg-card/70" aria-label="Loading server of the day" />
  }

  return (
    <section className="flex min-h-[248px] flex-col border border-border/70 bg-card/70 p-3 shadow-lg shadow-black/10">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-200">
        <Star className="h-3.5 w-3.5 fill-current" /> Server of the day
      </div>
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border border-primary/30 bg-background">
          {server.image_url ? <img src={server.image_url} alt="" className="h-full w-full object-cover" /> : <img src="/favicon.svg" alt="" className="h-6 w-6" />}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-foreground">{server.name}</h3>
        </div>
      </div>
      <p className="mt-2 line-clamp-3 text-[11px] leading-4 text-muted-foreground">{server.description}</p>
      <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3">
        <Link to={`/toplist/servers/${server.id}`} className="inline-flex items-center justify-center gap-1 whitespace-nowrap border border-primary/40 bg-primary/10 px-1.5 py-1.5 text-[10px] font-bold text-primary transition-colors hover:bg-primary/20">
          <Play className="h-3 w-3 fill-current" /> Play now
        </Link>
        <a href={server.discord_invite || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 whitespace-nowrap border border-[#5865F2]/40 bg-[#5865F2]/10 px-1.5 py-1.5 text-[10px] font-bold text-[#aab3ff] transition-colors hover:bg-[#5865F2]/20">
          <MessageCircle className="h-3 w-3" /> Discord
        </a>
      </div>
    </section>
  )
}

export function ServerOfTheMonth() {
  const server = useFeaturedServer()

  if (!server) return null

  return (
    <section className="w-full max-w-[728px] border border-slate-300/60 bg-slate-200/[0.06] p-2 shadow-[0_0_18px_rgba(203,213,225,0.2)]">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-200"><Star className="h-3.5 w-3.5 fill-current text-slate-300" /> Server of the month</span>
        <span className="truncate text-xs font-semibold text-slate-300">{server.name}</span>
      </div>
      <div className="relative aspect-[728/90] overflow-hidden border border-slate-200/35 bg-black">
        <img src={server.banner_url || ""} alt={`${server.name} banner`} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/35" />
        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <Link to={`/toplist/servers/${server.id}`} className="inline-flex items-center gap-1 border border-white/35 bg-black/65 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm hover:bg-black/85">
            <Play className="h-3 w-3 fill-current" /> Play now
          </Link>
          <a href={server.discord_invite || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 border border-[#aab3ff]/45 bg-[#5865F2]/75 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm hover:bg-[#5865F2]">
            <MessageCircle className="h-3 w-3" /> Discord
          </a>
        </div>
      </div>
    </section>
  )
}
