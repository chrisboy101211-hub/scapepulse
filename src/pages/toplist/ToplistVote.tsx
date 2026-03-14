import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"
import { useAuth } from "@/lib/auth"

export default function ToplistVote() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [server, setServer] = useState<ToplistServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [voted, setVoted] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!id) return
    toplistDataService.getServer(Number(id))
      .then(setServer)
      .finally(() => setLoading(false))
  }, [id])

  const handleVote = async () => {
    if (!server) return
    setVoting(true)
    setError("")
    try {
      await toplistDataService.voteForServer(server.id, user?.id)
      setVoted(true)
    } catch (e: any) {
      setError(e?.message || "Failed to vote. Please try again.")
    } finally {
      setVoting(false)
    }
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

  if (voted) {
    return (
      <div className="min-h-screen bg-background">
        <ToplistHeader />
        <div className="container mx-auto px-6 py-16 max-w-lg text-center">
          <div className="bg-card border border-green-500/30 rounded-2xl p-8 shadow-xl">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Vote Recorded!</h2>
            <p className="text-muted-foreground mb-6">
              Thanks for voting for <span className="font-semibold text-foreground">{server.name}</span>!
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link to={`/toplist/servers/${server.id}`}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                View Server
              </Link>
              <Link to="/toplist"
                className="px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors text-foreground">
                Back to Toplist
              </Link>
            </div>
          </div>
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
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border">
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
            You can vote for this server once every 24 hours. Your vote helps the server grow!
          </p>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleVote}
            disabled={voting}
            className="w-full py-4 text-lg font-bold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl shadow-lg shadow-green-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {voting ? "Voting..." : "🗳️ Vote Now"}
          </button>

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
