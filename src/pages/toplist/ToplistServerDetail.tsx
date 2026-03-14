import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { toplistDataService, type ToplistServer, type ToplistReview } from "@/lib/toplist-data"
import { useAuth } from "@/lib/auth"

function StarRating({ rating, readonly = false, size = "sm", onChange }: {
  rating: number
  readonly?: boolean
  size?: "sm" | "md" | "lg"
  onChange?: (r: number) => void
}) {
  const [hover, setHover] = useState(0)
  const sz = size === "lg" ? "w-8 h-8" : size === "md" ? "w-6 h-6" : "w-4 h-4"

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${sz} transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
        >
          <svg viewBox="0 0 20 20" fill={(hover || rating) >= star ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days > 30) return new Date(dateStr).toLocaleDateString()
  if (days > 0) return `${days}d ago`
  const hours = Math.floor(diff / 3600000)
  if (hours > 0) return `${hours}h ago`
  return "Just now"
}

export default function ToplistServerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [server, setServer] = useState<ToplistServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [reviews, setReviews] = useState<ToplistReview[]>([])
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      toplistDataService.getServer(Number(id)),
      toplistDataService.getReviews(Number(id)),
    ]).then(([srv, rev]) => {
      setServer(srv)
      if (rev && typeof rev === "object" && "reviews" in rev) {
        setReviews((rev as any).reviews)
        setReviewStats({ averageRating: (rev as any).averageRating, totalReviews: (rev as any).totalReviews })
      }
    }).finally(() => setLoading(false))
  }, [id])

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !id) return
    setReviewSubmitting(true)
    try {
      await toplistDataService.upsertReview({
        server_id: Number(id),
        user_id: user.id,
        rating: reviewRating,
        comment: reviewComment,
      })
      const rev = await toplistDataService.getReviews(Number(id))
      if (rev && typeof rev === "object" && "reviews" in rev) {
        setReviews((rev as any).reviews)
        setReviewStats({ averageRating: (rev as any).averageRating, totalReviews: (rev as any).totalReviews })
      }
      setShowReviewForm(false)
    } catch {} finally {
      setReviewSubmitting(false)
    }
  }

  const parseTags = (tags: string[] | string): string[] => {
    if (Array.isArray(tags)) return tags
    try { return JSON.parse(tags) } catch { return [] }
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

  const tabs = [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "reviews", label: "Reviews", icon: "⭐", count: reviewStats.totalReviews },
    { id: "stats", label: "Statistics", icon: "📊" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <ToplistHeader />
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Server Header */}
        <div className={`mb-8 rounded-2xl border shadow-xl relative overflow-hidden ${
          server.is_sponsor ? "bg-gradient-to-r from-purple-50/10 to-violet-50/10 border-purple-400/50 sponsor-glow" :
          server.is_premium ? "bg-gradient-to-r from-yellow-50/10 to-amber-50/10 border-yellow-400/50 premium-glow" :
          "bg-card/80 border-border"
        }`}>
          <div className="absolute inset-0 bg-cover bg-center opacity-5"
            style={{ backgroundImage: "url(https://i.gyazo.com/7b8273f3a49013f0a4d0d45b4dc5286a.png)" }} />

          <div className="p-6 relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6 flex-1">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border shadow-lg flex-shrink-0">
                  {server.image_url ? (
                    <img src={server.image_url} alt={`${server.name} logo`} className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.style.display = "none" }} />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary font-bold text-xl">{server.name.charAt(0)}</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <h1 className="text-3xl font-bold text-foreground">{server.name}</h1>
                    {server.is_sponsor && (
                      <span className="px-2 py-0.5 text-sm rounded bg-purple-400/20 text-purple-400 border border-purple-400/30">👑 Sponsor</span>
                    )}
                    {server.is_premium && !server.is_sponsor && (
                      <span className="px-2 py-0.5 text-sm rounded bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">⭐ Premium</span>
                    )}
                  </div>

                  <div className="flex items-center flex-wrap gap-2 mb-4">
                    <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded border border-primary/30">{server.revision}</span>
                    <span className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">{server.server_type}</span>
                    {server.experience_rate && (
                      <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">XP: {server.experience_rate}</span>
                    )}
                    {server.player_count && (
                      <div className="flex items-center space-x-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-400/30">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm font-semibold">{server.player_count} online</span>
                      </div>
                    )}
                  </div>

                  {reviewStats.totalReviews > 0 && (
                    <div className="flex items-center space-x-2 mb-4">
                      <StarRating rating={reviewStats.averageRating} readonly size="sm" />
                      <span className="font-semibold text-foreground">{reviewStats.averageRating}</span>
                      <span className="text-muted-foreground text-sm">({reviewStats.totalReviews} reviews)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center flex-shrink-0 min-w-[140px]">
                <button
                  onClick={() => navigate(`/toplist/vote/${server.id}`)}
                  className="mb-3 w-full px-6 py-3 text-base font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-lg transition-all"
                >
                  🗳️ Vote Now
                </button>
                <div className="text-2xl font-bold text-primary">{server.votes.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Votes</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-6">
              <a href={server.website} target="_blank" rel="noopener noreferrer"
                className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-400/30 rounded-lg transition-all text-sm font-medium">
                🌐 Visit Website
              </a>
              <button onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 border border-yellow-400/30 hover:bg-yellow-400/10 rounded-lg text-sm font-medium text-foreground transition-all">
                ⭐ Leave Review
              </button>
              {server.discord_invite && (
                <a href={server.discord_invite} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-lg text-sm font-medium transition-colors">
                  💬 Discord
                </a>
              )}
            </div>
          </div>

          <div className="h-1 bg-gradient-to-r from-transparent via-yellow-500/80 to-transparent" />

          <div className="border-t border-border/50 p-6 bg-background/5 relative z-10">
            <p className="text-foreground leading-relaxed">{server.description}</p>
            {parseTags(server.tags).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
                {parseTags(server.tags).map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {server.banner_url && (
            <div className="p-4 border-t border-border/50 flex justify-center relative z-10 bg-background/5">
              <img src={server.banner_url} alt={`${server.name} banner`}
                className="h-[80px] object-contain border border-border rounded-lg"
                style={{ maxWidth: "728px", width: "auto" }}
                onError={(e) => { e.currentTarget.style.display = "none" }} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 border-b border-border bg-card/80 backdrop-blur-sm p-2 rounded-t-2xl">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-all rounded-lg flex items-center space-x-2 ${
                activeTab === tab.id ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? "bg-primary-foreground/20" : "bg-secondary"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Server Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-sm text-muted-foreground">Revision</p><p className="text-foreground">{server.revision}</p></div>
                    <div><p className="text-sm text-muted-foreground">Server Type</p><p className="text-foreground">{server.server_type}</p></div>
                    {server.experience_rate && <div><p className="text-sm text-muted-foreground">Experience Rate</p><p className="text-foreground">{server.experience_rate}</p></div>}
                    <div><p className="text-sm text-muted-foreground">Added</p><p className="text-foreground">{new Date(server.created_at).toLocaleDateString()}</p></div>
                  </div>
                </div>
                {server.features && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Server Features</h3>
                    <p className="text-foreground whitespace-pre-wrap">{server.features}</p>
                  </div>
                )}
                {server.rules && (
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">Server Rules</h3>
                    <p className="text-foreground whitespace-pre-wrap">{server.rules}</p>
                  </div>
                )}
              </div>
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-muted-foreground">Total Votes</span><span className="font-semibold">{server.votes.toLocaleString()}</span></div>
                    {server.player_count && <div className="flex justify-between"><span className="text-muted-foreground">Players Online</span><span className="font-semibold text-green-500">{server.player_count}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-semibold text-green-500">Online</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tier</span><span className={`font-semibold ${server.is_sponsor ? "text-purple-400" : server.is_premium ? "text-yellow-500" : "text-muted-foreground"}`}>{server.is_sponsor ? "Sponsor" : server.is_premium ? "Premium" : "Standard"}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">Reviews & Ratings</h3>
                  {user && (
                    <button onClick={() => setShowReviewForm(!showReviewForm)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">
                      Write Review
                    </button>
                  )}
                </div>

                {showReviewForm && user && (
                  <form onSubmit={handleReviewSubmit} className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
                    <h4 className="font-medium mb-3">Your Review</h4>
                    <div className="mb-3">
                      <label className="text-sm text-muted-foreground mb-1 block">Rating</label>
                      <StarRating rating={reviewRating} size="md" onChange={setReviewRating} />
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={3}
                      placeholder="Share your experience..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex space-x-3 mt-3">
                      <button type="submit" disabled={reviewSubmitting}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50">
                        {reviewSubmitting ? "Submitting..." : "Submit"}
                      </button>
                      <button type="button" onClick={() => setShowReviewForm(false)}
                        className="px-4 py-2 border border-border rounded-md text-sm text-foreground hover:bg-secondary">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {reviewStats.totalReviews > 0 ? (
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="text-5xl font-bold text-primary">{reviewStats.averageRating}</div>
                    <div>
                      <StarRating rating={reviewStats.averageRating} readonly size="lg" />
                      <p className="text-muted-foreground mt-1">{reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">⭐</div>
                    <p className="text-muted-foreground">No reviews yet. Be the first!</p>
                  </div>
                )}

                <div className="space-y-4">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {(review.user_name || "A").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{review.user_name || "Anonymous"}</p>
                          <div className="flex items-center space-x-2">
                            <StarRating rating={review.rating} readonly size="sm" />
                            <span className="text-xs text-muted-foreground">{formatTimeAgo(review.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-6">Voting Statistics</h3>
                <div className="text-center p-6 bg-primary/10 rounded-lg mb-4">
                  <div className="text-4xl font-bold text-primary mb-2">{server.votes.toLocaleString()}</div>
                  <div className="text-muted-foreground">Total Votes</div>
                </div>
                <div className="text-center p-6 bg-accent/10 rounded-lg">
                  <div className="text-3xl font-bold text-accent mb-2">{server.monthly_votes.toLocaleString()}</div>
                  <div className="text-muted-foreground">This Month</div>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-6">Server Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between"><span className="text-muted-foreground">Added</span><span>{new Date(server.created_at).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={server.is_sponsor ? "text-purple-400" : server.is_premium ? "text-yellow-500" : "text-muted-foreground"}>{server.is_sponsor ? "Sponsor" : server.is_premium ? "Premium" : "Standard"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Top 10</span><span className={server.is_top10 ? "text-green-500" : "text-muted-foreground"}>{server.is_top10 ? "Yes" : "No"}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ToplistFooter />
    </div>
  )
}
