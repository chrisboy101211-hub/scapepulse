import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

export function SponsoredSlider() {
  const [servers, setServers] = useState<ToplistServer[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    toplistDataService.getTop10Servers()
      .then(setServers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (servers.length <= 1) return
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % servers.length)
    }, 5000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [servers.length])

  const go = (index: number) => {
    setCurrent(index)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % servers.length)
    }, 5000)
  }

  if (loading) {
    return (
      <div className="w-full h-[220px] rounded-2xl bg-card border border-border animate-pulse mb-10" />
    )
  }

  if (servers.length === 0) return null

  const server = servers[current]

  const parseTags = (tags: string[] | string): string[] => {
    if (Array.isArray(tags)) return tags
    try { return JSON.parse(tags) } catch { return [] }
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">⭐</span>
          <span className="text-sm font-semibold text-foreground uppercase tracking-wide">Sponsored Servers</span>
        </div>
        <Link to="/toplist/submit" className="text-xs text-primary hover:text-primary/80 transition-colors border border-primary/30 rounded-full px-3 py-1">
          + Submit Your Server
        </Link>
      </div>

      <div className="relative rounded-2xl overflow-hidden border shadow-2xl" style={{
        borderColor: server.is_sponsor ? "rgba(168,85,247,0.4)" : "rgba(234,179,8,0.4)",
        background: server.is_sponsor
          ? "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(109,40,217,0.08) 100%)"
          : "linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(180,130,0,0.08) 100%)",
      }}>
        {server.banner_url && (
          <div className="absolute inset-0">
            <img src={server.banner_url} alt="" className="w-full h-full object-cover opacity-15" onError={(e) => { e.currentTarget.style.display = "none" }} />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/40" />
          </div>
        )}

        <div className="relative z-10 flex items-center gap-6 p-6 min-h-[180px]">
          <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 shadow-lg" style={{ borderColor: server.is_sponsor ? "rgba(168,85,247,0.5)" : "rgba(234,179,8,0.5)" }}>
            {server.image_url ? (
              <img src={server.image_url} alt={server.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none" }} />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">{server.name.charAt(0)}</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-foreground truncate">{server.name}</h2>
              {server.is_sponsor && (
                <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-purple-400/20 text-purple-400 border border-purple-400/30 font-semibold">
                  👑 SPONSOR
                </span>
              )}
              {server.is_premium && !server.is_sponsor && (
                <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 font-semibold">
                  ⭐ PREMIUM
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">{server.revision}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{server.server_type}</span>
              {server.experience_rate && (
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{server.experience_rate} XP</span>
              )}
              {parseTags(server.tags).slice(0, 3).map((tag, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded bg-muted/50 text-muted-foreground">{tag}</span>
              ))}
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 max-w-xl">
              {server.short_description || server.description}
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              <a href={server.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-500/20 transition-all text-sm">
                Play Now
              </a>

              {server.discord_invite && (
                <a href={server.discord_invite} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold rounded-lg transition-colors text-sm">
                  Discord
                </a>
              )}

              <Link to={`/toplist/vote/${server.id}`} className="flex items-center gap-2 px-5 py-2.5 border border-border bg-card/50 hover:bg-card text-foreground font-semibold rounded-lg transition-colors text-sm">
                🗳️ {server.votes.toLocaleString()} Votes
              </Link>

              <Link to={`/toplist/servers/${server.id}`} className="px-4 py-2.5 border border-border/50 hover:border-border bg-transparent text-muted-foreground hover:text-foreground rounded-lg transition-colors text-sm">
                View Details
              </Link>
            </div>
          </div>
        </div>

        {servers.length > 1 && (
          <div className="flex items-center justify-center gap-2 mt-3 pb-3">
            {servers.map((_, i) => (
              <button key={i} onClick={() => go(i)} className={`rounded-full transition-all ${i === current ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-border hover:bg-muted-foreground"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
