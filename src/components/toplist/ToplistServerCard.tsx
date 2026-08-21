import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

interface ToplistServerCardProps {
  server: ToplistServer
  rank: number
  onVote: () => void
}

export function ToplistServerCard({ server, rank, onVote }: ToplistServerCardProps) {
  const { user } = useAuth()
  const [bumpLoading, setBumpLoading] = useState(false)
  const [bumpMessage, setBumpMessage] = useState("")

  const isPremium = server.is_premium
  const isSponsored = server.is_sponsor
  const bannerFrameClass = isSponsored
    ? "border-violet-400/85 shadow-[0_0_16px_rgba(167,139,250,0.45)]"
    : isPremium
    ? "border-amber-400/85 shadow-[0_0_16px_rgba(251,191,36,0.4)]"
    : "border-black bg-black shadow-none"

  const handleVote = () => {
    window.location.href = `/toplist/vote/${server.id}`
  }

  const handleBump = async () => {
    setBumpLoading(true)
    setBumpMessage("")
    try {
      await toplistDataService.bumpServer(server.id, user?.id)
      setBumpMessage("Server bumped!")
      onVote()
    } catch {
      setBumpMessage("Could not bump server")
    } finally {
      setBumpLoading(false)
      setTimeout(() => setBumpMessage(""), 3000)
    }
  }

  const parseTags = (tags: string[] | string): string[] => {
    if (Array.isArray(tags)) return tags
    try { return JSON.parse(tags) } catch { return [] }
  }

  return (
    <div className={`group relative overflow-hidden border transition-all duration-300 hover:shadow-xl ${
      isSponsored
        ? "bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-400/30 sponsor-glow"
        : isPremium
        ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-400/30 premium-glow"
        : "bg-card/80 border-border/50 hover:border-border hover:shadow-lg"
    }`}>
      {/* Runescape bg texture */}
      <div className="absolute inset-0 bg-cover bg-center opacity-5"
        style={{ backgroundImage: "url(https://i.gyazo.com/7b8273f3a49013f0a4d0d45b4dc5286a.png)" }} />

      <div className="flex items-center min-h-[120px] relative z-10">
        {/* Rank */}
        <div className="flex-shrink-0 w-20 h-full flex items-center justify-center bg-gradient-to-b from-muted/30 to-muted/50 border-r border-border/30">
          <span className={`text-3xl font-bold ${
            rank === 1 ? "text-yellow-500" : rank === 2 ? "text-gray-400" : rank === 3 ? "text-orange-500" : "text-gray-600"
          }`}>#{rank}</span>
        </div>

        <div className="flex-1 flex items-center p-4">
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Link to={`/toplist/servers/${server.id}`}>
                <h3 className="text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors cursor-pointer">
                  {server.name}
                </h3>
              </Link>
              {isSponsored && (
                <span className="text-xs px-2 py-0.5 rounded bg-purple-400/20 text-purple-400 border border-purple-400/30">
                  👑 Sponsor
                </span>
              )}
              {isPremium && !isSponsored && (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                  ⭐ Premium
                </span>
              )}
            </div>

            {parseTags(server.tags).length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {parseTags(server.tags).slice(0, 6).map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {server.short_description || server.description}
            </p>

            {server.banner_url && (
              <div className={`mb-2 h-[80px] w-full max-w-[600px] overflow-hidden border-2 ${bannerFrameClass}`}>
                <img src={server.banner_url} alt={`${server.name} banner`}
                  className="h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none" }} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex flex-col items-end space-y-2 ml-4">
            <div className="flex items-center space-x-2">
              <Link to={`/toplist/servers/${server.id}`}
                className="px-3 py-1.5 text-sm border border-border/50 rounded-md hover:bg-muted/50 transition-colors text-foreground">
                ℹ️ Info
              </Link>
              {server.discord_invite && (
                <a href={server.discord_invite} target="_blank" rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] border border-[#5865F2]/30 rounded-md transition-colors">
                  💬 Discord
                </a>
              )}
              <button onClick={handleBump} disabled={bumpLoading}
                className="px-3 py-1.5 text-sm bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-md transition-colors disabled:opacity-50">
                {bumpLoading ? "..." : "Bump"}
              </button>
            </div>

            <button onClick={handleVote}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-8 py-3 text-lg min-w-[140px] rounded-md shadow-lg shadow-green-500/20 border border-green-500/30 transition-all">
              🗳️ {server.votes.toLocaleString()} Votes
            </button>

            {bumpMessage && (
              <div className="text-xs text-center px-2 py-1 rounded bg-muted/80 border border-border/50">
                {bumpMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
