import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

export default function ToplistVote() {
  const { id } = useParams<{ id: string }>()
  const [server, setServer] = useState<ToplistServer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    toplistDataService.getServer(Number(id))
      .then(setServer)
      .finally(() => setLoading(false))
  }, [id])

  const handleVote = () => {
    if (!server) return
    const voteTarget = server.vote_link || server.website
    window.open(voteTarget, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ToplistHeader />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background">
        <ToplistHeader />
        <div className="container mx-auto px-6 py-8 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-4">Server Not Found</h2>
          <Link to="/toplist" className="text-primary hover:underline">Back to Toplist</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ToplistHeader />
      <div className="container mx-auto px-6 py-16 max-w-lg">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {/* Server Info */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0">
              {server.image_url ? (
                <img src={server.image_url} alt={server.name} className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none" }} />
              ) : (
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">{server.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{server.name}</h1>
              <p className="text-muted-foreground">{server.votes.toLocaleString()} total votes</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-8 text-center">
            Clicking Vote Now will take you to the vote page. Your vote will be confirmed automatically once complete.
          </p>

          <button
            onClick={handleVote}
            className="w-full py-4 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all"
          >
            🗳️ Vote Now
          </button>

          <p className="mt-4 text-xs text-muted-foreground text-center">
            You can vote once every 12 hours. In-game rewards are granted automatically after your vote is confirmed.
          </p>

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <a href={server.website} target="_blank" rel="noopener noreferrer"
              className="text-primary hover:underline">
              Visit {server.name}
            </a>
            <Link to={`/toplist/servers/${server.id}`} className="hover:text-foreground transition-colors">
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
