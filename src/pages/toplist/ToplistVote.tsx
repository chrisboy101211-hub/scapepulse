import { useState, useEffect } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { AdvertisementSlot } from "@/components/toplist/AdvertisementSlot"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"
import { slotsForPlacement } from "@/lib/advertising"
import { Loader2 } from "lucide-react"

export default function ToplistVote() {
  const { id, incentive } = useParams<{ id: string; incentive?: string }>()
  const navigate = useNavigate()
  const [server, setServer] = useState<ToplistServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [voteError, setVoteError] = useState("")
  const [voteSuccess, setVoteSuccess] = useState(false)

  useEffect(() => {
    if (!id) return
    toplistDataService.getServer(Number(id))
      .then(async (serverData) => {
        setServer(serverData)
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!voteSuccess || !server) return
    const redirectTimer = window.setTimeout(() => navigate(`/toplist/servers/${server.id}`), 3000)
    return () => window.clearTimeout(redirectTimer)
  }, [navigate, server, voteSuccess])

  const handleVote = async () => {
    if (!server) return
    if (!username.trim()) {
      setVoteError("Enter your in-game username to vote.")
      return
    }

    setSubmitting(true)
    setVoteError("")
    try {
      await toplistDataService.submitVote(server.id, username, incentive)
      setVoteSuccess(true)
    } catch (error: any) {
      setVoteError(error?.message || "Vote could not be recorded.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ToplistHeader />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background">
        <ToplistHeader />
        <div className="container mx-auto px-6 py-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Server Not Found</h2>
          <Link to="/toplist" className="text-primary hover:underline">
            Back to Toplist
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ToplistHeader />
      <div className="container mx-auto max-w-[1440px] px-6 py-10">
        <div className="grid gap-6 xl:grid-cols-[160px_minmax(0,1fr)_160px]">
          <aside className="hidden xl:block">
            {slotsForPlacement("side-banner").filter((slot) => slot.id === "side-left-1").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} orientation="vertical" className="sticky top-28 h-[600px] w-[160px]" />)}
          </aside>
          <main className="min-w-0">
            <div className="mx-auto max-w-lg py-6">
              <div className="border border-border bg-card p-8 shadow-xl">
          {/* Server Info */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 border border-white/10 flex-shrink-0">
              {server.image_url ? (
                <img src={server.image_url} alt={server.name} className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{server.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{server.name}</h1>
              <p className="text-gray-400">{server.votes.toLocaleString()} total votes</p>
            </div>
          </div>

          <p className="text-gray-400 mb-5 text-center">
            Enter your in-game username, then confirm your vote. Your server reward is sent after approval.
          </p>

          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-400">In-game username</label>
          <input
            value={username}
            onChange={(event) => { setUsername(event.target.value); setVoteError("") }}
            disabled={submitting || voteSuccess}
            maxLength={64}
            placeholder="Your character name"
            className="mb-3 w-full border border-white/15 bg-black/25 px-4 py-3 text-center text-sm text-white outline-none placeholder:text-gray-500 focus:border-violet-400"
          />

          {voteError && <p className="mb-3 text-center text-sm text-red-300">{voteError}</p>}
          {voteSuccess && <p className="mb-3 text-center text-sm text-emerald-300">Vote confirmed. Your server callback has been notified. Returning to the server listing in 3 seconds…</p>}

          <button
            onClick={handleVote}
            disabled={submitting || voteSuccess}
            className="w-full bg-primary py-4 text-lg font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Confirming vote…" : voteSuccess ? "Vote Confirmed" : "🗳️ Vote Now"}
          </button>

          <p className="mt-4 text-xs text-gray-500 text-center">
            You can vote once every 12 hours. In-game rewards are granted after your vote is confirmed.
          </p>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
            <a href={server.website} target="_blank" rel="noopener noreferrer"
              className="text-primary transition-colors hover:text-primary/80">
              Visit {server.name}
            </a>
            <Link to={`/toplist/servers/${server.id}`} className="text-primary transition-colors hover:text-primary/80">
              View Details
            </Link>
          </div>
              </div>
            </div>
          </main>
          <aside className="hidden xl:block">
            {slotsForPlacement("side-banner").filter((slot) => slot.id === "side-right-1").map((slot) => <AdvertisementSlot key={slot.id} slot={slot} orientation="vertical" className="sticky top-28 h-[600px] w-[160px]" />)}
          </aside>
        </div>
      </div>
      <ToplistFooter />
    </div>
  )
}
