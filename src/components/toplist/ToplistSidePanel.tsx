import { useEffect, useState } from "react"
import { MessageCircle, Play, Trophy } from "lucide-react"
import { Link } from "react-router-dom"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

type ToplistSidePanelProps = {
  kind: "votes" | "newest"
}

export function ToplistSidePanel({ kind }: ToplistSidePanelProps) {
  const [servers, setServers] = useState<ToplistServer[]>([])
  const isVotes = kind === "votes"

  useEffect(() => {
    const loadServers = isVotes
      ? toplistDataService.getMostVotedServers()
      : toplistDataService.getNewestServers()

    loadServers.then(setServers).catch(() => setServers([]))
  }, [isVotes])

  return (
    <section className="rounded-xl border border-border/70 bg-card/55 p-2.5 shadow-lg shadow-black/10 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        {isVotes ? <Trophy className="h-4 w-4 text-amber-300" /> : <span className="flex h-4 w-4 items-center justify-center rounded-full border border-primary/50 text-[10px] text-primary">+</span>}
        <h2 className="font-display text-sm font-bold text-foreground">{isVotes ? "Top 5 by votes" : "Newest servers"}</h2>
      </div>

      <div className="space-y-1.5">
        {servers.length === 0 ? (
          [...Array(5)].map((_, index) => <div key={index} className="h-14 animate-pulse rounded-lg border border-border/40 bg-background/30" />)
        ) : servers.map((server) => (
          <article key={server.id} className="group relative min-h-14 overflow-hidden rounded-lg border border-border/55 bg-background/40 p-1.5 transition-colors hover:border-primary/50 hover:bg-secondary/45">
            <div className="flex items-center gap-2 transition-opacity group-hover:opacity-20">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-primary/20 bg-card">
                {server.image_url ? <img src={server.image_url} alt="" className="h-full w-full object-cover" /> : <img src="/favicon.svg" alt="" className="h-5 w-5" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-foreground">{server.name}</span>
                <span className="block text-[10px] text-muted-foreground">{isVotes ? `${server.votes.toLocaleString()} votes` : "New listing"}</span>
              </span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-card/92 px-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <Link to={`/toplist/servers/${server.id}`} className="inline-flex items-center gap-1 rounded-md bg-primary px-1.5 py-1.5 text-[9px] font-bold text-primary-foreground hover:brightness-110">
                <Play className="h-3 w-3 fill-current" /> Play
              </Link>
              {server.discord_invite && <a href={server.discord_invite} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-primary/40 px-1.5 py-1.5 text-[9px] font-bold text-primary hover:bg-primary/10">
                <MessageCircle className="h-3 w-3" /> Discord
              </a>}
              {!server.discord_invite && <span title="Discord link not provided" className="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-border px-1.5 py-1.5 text-[9px] font-bold text-muted-foreground">
                <MessageCircle className="h-3 w-3" /> Discord
              </span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
