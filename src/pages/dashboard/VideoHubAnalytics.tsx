import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { getYouTubeVideoId, formatViews, formatTimeAgo, type Video } from "@/lib/video-hub-data"
import { useAuth } from "@/lib/auth"
import { Video as VideoIcon, ThumbsUp, ThumbsDown, Eye, TrendingUp, Film, ExternalLink } from "lucide-react"

interface Stats {
  totalVideos: number
  totalViews: number
  totalLikes: number
  totalDislikes: number
  totalComments: number
  byCategory: Record<string, number>
  topVideos: Video[]
  recentVideos: Video[]
}

const CATEGORY_COLORS: Record<string, string> = {
  PVP:      "bg-red-500/20 text-red-400 border-red-500/30",
  PVM:      "bg-orange-500/20 text-orange-400 border-orange-500/30",
  GUIDES:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  REVIEWS:  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  UPDATES:  "bg-green-500/20 text-green-400 border-green-500/30",
  MONTAGES: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  GENERAL:  "bg-secondary text-muted-foreground border-border",
}

export default function VideoHubAnalytics() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: videos } = await supabase
        .from("videos")
        .select("*")
        .eq("submitter_id", user.id)
        .eq("is_approved", true)
        .order("views", { ascending: false })

      const videoIds = (videos ?? []).map((v: Video) => v.id)

      const { count: commentCount } = videoIds.length > 0
        ? await supabase
            .from("video_comments")
            .select("*", { count: "exact", head: true })
            .in("video_id", videoIds)
        : { count: 0 }

      const all = (videos ?? []) as Video[]

      const byCategory: Record<string, number> = {}
      let totalViews = 0, totalLikes = 0, totalDislikes = 0
      for (const v of all) {
        totalViews += v.views
        totalLikes += v.likes
        totalDislikes += v.dislikes
        byCategory[v.category] = (byCategory[v.category] ?? 0) + 1
      }

      const topVideos = [...all].sort((a, b) => b.views - a.views).slice(0, 5)
      const recentVideos = [...all].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)

      setStats({
        totalVideos: all.length,
        totalViews,
        totalLikes,
        totalDislikes,
        totalComments: commentCount ?? 0,
        byCategory,
        topVideos,
        recentVideos,
      })
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) return null

  if (stats.totalVideos === 0) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <VideoIcon className="h-6 w-6 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Video Hub Analytics</h1>
            <p className="text-sm text-muted-foreground">Your submitted videos</p>
          </div>
        </div>
        <div className="border border-border/40 rounded-lg p-8 text-center">
          <VideoIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm mb-4">You haven't submitted any videos yet.</p>
          <Link
            to="/video-hub/submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm font-medium transition-colors"
          >
            Submit a Video
          </Link>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: "Total Videos",   value: stats.totalVideos.toLocaleString(),   icon: Film,       color: "text-blue-400" },
    { label: "Total Views",    value: formatViews(stats.totalViews),         icon: Eye,        color: "text-green-400" },
    { label: "Total Likes",    value: stats.totalLikes.toLocaleString(),     icon: ThumbsUp,   color: "text-primary" },
    { label: "Total Dislikes", value: stats.totalDislikes.toLocaleString(),  icon: ThumbsDown, color: "text-red-400" },
    { label: "Comments",       value: stats.totalComments.toLocaleString(),  icon: TrendingUp, color: "text-purple-400" },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <VideoIcon className="h-6 w-6 text-red-500" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Video Hub Analytics</h1>
            <p className="text-sm text-muted-foreground">Analytics for your submitted videos</p>
          </div>
        </div>
        <Link
          to="/video-hub"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border/60 rounded text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Hub
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="border border-border/40 rounded-lg p-4 bg-card/50">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Videos by Category */}
        <div className="border border-border/40 rounded-lg p-4 bg-card/50">
          <h2 className="text-sm font-semibold text-foreground mb-3">Videos by Category</h2>
          {Object.keys(stats.byCategory).length === 0 ? (
            <p className="text-xs text-muted-foreground">No videos yet.</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(stats.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const pct = stats.totalVideos > 0 ? Math.round((count / stats.totalVideos) * 100) : 0
                  return (
                    <div key={cat}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.GENERAL}`}>
                          {cat.toLowerCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">{count} · {pct}%</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Top Videos by Views */}
        <div className="border border-border/40 rounded-lg p-4 bg-card/50 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground mb-3">Top Videos by Views</h2>
          {stats.topVideos.length === 0 ? (
            <p className="text-xs text-muted-foreground">No videos yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topVideos.map((v, i) => {
                const vid = getYouTubeVideoId(v.youtube_url)
                const thumb = v.thumbnail_url || `https://img.youtube.com/vi/${vid}/mqdefault.jpg`
                return (
                  <div key={v.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/30 transition-colors group">
                    <span className="text-sm font-bold text-muted-foreground w-5 text-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <img src={thumb} alt={v.title}
                      className="w-14 aspect-video object-cover rounded flex-shrink-0 bg-muted" />
                    <div className="flex-1 min-w-0">
                      <Link to={`/video-hub/${v.id}`}
                        className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {v.title}
                      </Link>
                      <p className="text-xs text-muted-foreground truncate">{v.channel_name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-foreground">{formatViews(v.views)}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                        <ThumbsUp className="h-3 w-3" />{v.likes}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recently Added */}
      <div className="border border-border/40 rounded-lg p-4 bg-card/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">Recently Added</h2>
          <Link to="/video-hub" className="text-xs text-primary hover:text-primary/80 transition-colors">
            View all →
          </Link>
        </div>
        {stats.recentVideos.length === 0 ? (
          <p className="text-xs text-muted-foreground">No videos yet.</p>
        ) : (
          <div className="divide-y divide-border/30">
            {stats.recentVideos.map((v) => {
              const vid = getYouTubeVideoId(v.youtube_url)
              const thumb = v.thumbnail_url || `https://img.youtube.com/vi/${vid}/mqdefault.jpg`
              const catCls = CATEGORY_COLORS[v.category] ?? CATEGORY_COLORS.GENERAL
              return (
                <div key={v.id} className="flex items-center gap-3 py-2.5 group">
                  <img src={thumb} alt={v.title}
                    className="w-16 aspect-video object-cover rounded flex-shrink-0 bg-muted" />
                  <div className="flex-1 min-w-0">
                    <Link to={`/video-hub/${v.id}`}
                      className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {v.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{v.channel_name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium capitalize ${catCls}`}>
                      {v.category.toLowerCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatTimeAgo(v.created_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
