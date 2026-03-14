import { Link } from "react-router-dom"
import { type ToplistServer } from "@/lib/toplist-data"

interface Top10ServerCardProps {
  server: ToplistServer
  rank: number
}

export function Top10ServerCard({ server, rank }: Top10ServerCardProps) {
  return (
    <div className="group hover:scale-105 transition-transform duration-300 flex flex-col items-center space-y-3">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-bold text-muted-foreground">#{rank}</span>
        <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
          {server.name}
        </h3>
        <a href={server.website} target="_blank" rel="noopener noreferrer"
          className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          Play Now
        </a>
        {server.discord_invite && (
          <a href={server.discord_invite} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1 text-xs bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-md transition-colors">
            Discord
          </a>
        )}
      </div>

      <div className="flex justify-center w-full">
        {server.banner_url ? (
          <div className="w-full max-w-[728px] h-[90px] rounded-lg border border-border/30 shadow-md overflow-hidden">
            <img src={server.banner_url} alt={`${server.name} banner`}
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = "none" }} />
          </div>
        ) : (
          <div className="w-full max-w-[728px] h-[90px] bg-gradient-to-r from-primary/20 to-accent/20 rounded-lg border border-border/30 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{server.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
