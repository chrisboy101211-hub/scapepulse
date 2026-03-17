import { Link } from "react-router-dom"
import { type ToplistServer } from "@/lib/toplist-data"

interface Top10ServerCardProps {
  server: ToplistServer
  rank: number
}

export function Top10ServerCard({ server, rank }: Top10ServerCardProps) {
  // Top 3 are simplified - just name, banner, play now, discord
  if (rank <= 3) {
    return (
      <div className="group relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-xl">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10" />

        <div className="flex items-center relative z-10">
          {/* Banner - Full width */}
          <div className="flex-1 p-3">
            {server.banner_url ? (
              <div className="w-full h-16 rounded-lg border border-border/30 overflow-hidden">
                <img
                  src={server.banner_url}
                  alt={`${server.name} banner`}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none" }}
                />
              </div>
            ) : (
              <div className="w-full h-16 rounded-lg border border-border/30 bg-muted/20 flex items-center justify-center">
                <span className="font-bold text-foreground">{server.name}</span>
              </div>
            )}
          </div>

          {/* Server Name & Buttons */}
          <div className="flex items-center gap-3 pr-3">
            <span className="text-lg font-bold text-foreground">{server.name}</span>
            
            <a
              href={server.website}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Play Now
            </a>
            
            {server.discord_invite && (
              <a
                href={server.discord_invite}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm bg-[#5865F2] text-white rounded hover:bg-[#4752C4] transition-colors"
              >
                Discord
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Regular cards (rank 4+) - full display
  const isSponsored = server.is_sponsor
  const isPremium = server.is_premium

  const parseTags = (tags: string[] | string): string[] => {
    if (Array.isArray(tags)) return tags
    try { return JSON.parse(tags) } catch { return [] }
  }

  return (
    <div className="group relative overflow-hidden rounded-lg border transition-all duration-300 hover:shadow-xl">
      {/* Background gradient based on status */}
      <div className={`absolute inset-0 ${
        isSponsored
          ? "bg-gradient-to-r from-purple-500/10 to-violet-500/10"
          : isPremium
          ? "bg-gradient-to-r from-yellow-500/10 to-amber-500/10"
          : "bg-card/80"
      }`} />

      <div className="flex items-center min-h-[120px] relative z-10">
        {/* Large Rank Number - Left Side */}
        <div className="flex-shrink-0 w-20 h-full flex items-center justify-center bg-gradient-to-b from-muted/30 to-muted/50 border-r border-border/30">
          <div className="text-3xl font-bold text-gray-600">
            #{rank}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center p-4">
          {/* Left Side - Server Info */}
          <div className="flex-1 min-w-0">
            {/* Server Name and Badges */}
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

            {/* Banner - Prominent Display */}
            {server.banner_url && (
              <div className="mb-2">
                <div className="w-full max-w-[600px] h-[80px] rounded-lg border border-border/30 overflow-hidden bg-muted/20 shadow-md">
                  <img
                    src={server.banner_url}
                    alt={`${server.name} banner`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Action Buttons */}
          <div className="flex-shrink-0 flex flex-col items-end space-y-2 ml-4">
            {/* Vote Button - Large and Prominent */}
            <Link
              to={`/toplist/vote/${server.id}`}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold px-8 py-3 text-lg min-w-[140px] rounded-md shadow-lg shadow-green-500/20 border border-green-500/30 transition-all text-center"
            >
              🗳️ {server.votes.toLocaleString()} Votes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
