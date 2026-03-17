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
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-foreground flex items-center">
          <span className="text-yellow-400 mr-1.5">👑</span>
          Top {servers.length}
        </h2>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-purple-600/10 rounded-xl blur-lg" />
        <div className="relative bg-card/50 backdrop-blur-sm border border-purple-400/20 rounded-xl p-3 shadow-lg shadow-purple-500/10">
          <div className="space-y-2">
            {servers.map((server, index) => (
              <div key={server.id} className="bg-card/60 border border-border/20 rounded-lg p-2 hover:border-primary/20 transition-colors">
                <Top10ServerCard server={server} rank={index + 1} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
