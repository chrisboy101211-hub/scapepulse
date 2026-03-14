import { useState, useEffect } from "react"
import { Top10ServerCard } from "./Top10ServerCard"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

export function Top10ServersList() {
  const [servers, setServers] = useState<ToplistServer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    toplistDataService.getTop10Servers()
      .then(setServers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || servers.length === 0) return null

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center">
          <span className="text-yellow-400 mr-2">👑</span>
          Top {servers.length} Server{servers.length !== 1 ? "s" : ""}
        </h2>
        <span className="text-sm text-muted-foreground">Premium sponsored placement</span>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-violet-500/15 to-purple-600/15 rounded-2xl blur-xl" />
        <div className="relative bg-card/50 backdrop-blur-sm border border-purple-400/30 rounded-2xl p-6 shadow-2xl shadow-purple-500/20">
          <div className="space-y-3">
            {servers.map((server, index) => (
              <div key={server.id} className="bg-card/80 border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors">
                <Top10ServerCard server={server} rank={index + 1} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
