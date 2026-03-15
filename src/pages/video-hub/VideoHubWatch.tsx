import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import NavBar from "@/components/NavBar"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { VideoLikeButton } from "@/components/VideoLikeButton"
import { VideoComments } from "@/components/VideoComments"
import {
  videoHubService,
  getYouTubeVideoId,
  formatViews,
  formatTimeAgo,
  type Video,
} from "@/lib/video-hub-data"
import { useAuth } from "@/lib/auth"

export default function VideoHubWatch() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [video, setVideo] = useState<Video | null>(null)
  const [related, setRelated] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [theater, setTheater] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setDescExpanded(false)
    Promise.all([
      videoHubService.getVideo(id, user?.id),
      videoHubService.getRelatedVideos(id, 15),
    ]).then(([v, r]) => {
      if (!v) { navigate("/video-hub"); return }
      setVideo(v)
      setRelated(r)
    }).finally(() => setLoading(false))
  }, [id, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="flex justify-center items-center h-[60vh]">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  if (!video) return null

  const vid = getYouTubeVideoId(video.youtube_url)
  const CATEGORY_COLORS: Record<string, string> = {
    PVP: "bg-red-500/20 text-red-400 border-red-500/30",
    PVM: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    GUIDES: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    REVIEWS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    UPDATES: "bg-green-500/20 text-green-400 border-green-500/30",
    MONTAGES: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    GENERAL: "bg-secondary text-muted-foreground border-border",
  }
  const catClass = CATEGORY_COLORS[video.category] ?? CATEGORY_COLORS.GENERAL

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Theater mode: full-width dark bar for the player */}
      {theater && (
        <div className="w-full bg-black">
          <div className="mx-auto max-w-[1400px]">
            <div className="w-full aspect-video">
              <iframe
                key={`theater-${video.id}`}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 py-6 max-w-[1400px]">
        <div className={`flex gap-6 items-start ${theater ? "flex-col" : ""}`}>

          {/* ── LEFT: player + info + comments ─────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Player (hidden in theater mode — shown in the bar above) */}
            <div className={`w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ${theater ? "hidden" : ""}`}>
              <iframe
                key={video.id}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-foreground mt-4 mb-3 leading-snug">
              {video.title}
            </h1>

            {/* Meta row */}
            <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
              {/* Channel + stats */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {video.channel_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  {video.channel_url ? (
                    <a href={video.channel_url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                      {video.channel_name}
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-foreground">{video.channel_name}</span>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{formatViews(video.views)} views</span>
                    <span>•</span>
                    <span>{formatTimeAgo(video.created_at)}</span>
                    {video.duration && <><span>•</span><span>{video.duration}</span></>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${catClass}`}>
                  {video.category.toLowerCase()}
                </span>
                {video.is_featured && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-medium">
                    ⭐ Featured
                  </span>
                )}
                <a href={video.youtube_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FF0000]/10 hover:bg-[#FF0000]/20 text-[#FF0000] border border-[#FF0000]/30 rounded-lg text-xs font-medium transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                  Watch on YouTube
                </a>
                <button
                  onClick={() => setTheater((t) => !t)}
                  title={theater ? "Exit theater mode" : "Theater mode"}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-foreground border border-border rounded-lg text-xs font-medium transition-colors"
                >
                  {theater ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  )}
                  {theater ? "Exit Theater" : "Theater"}
                </button>
                <VideoLikeButton
                  videoId={video.id}
                  initialLikes={video.likes}
                  initialDislikes={video.dislikes}
                  initialUserVote={video.user_vote}
                  size="md"
                />
              </div>
            </div>

            {/* Description */}
            {video.description && (
              <div className="bg-secondary/30 rounded-xl p-4 mb-6 border border-border/50">
                <p className={`text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}>
                  {video.description}
                </p>
                {video.description.length > 200 && (
                  <button onClick={() => setDescExpanded((v) => !v)}
                    className="text-xs text-primary hover:text-primary/80 mt-2 font-medium transition-colors">
                    {descExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-border mb-6" />

            {/* Comments */}
            <VideoComments videoId={video.id} />
          </div>

          {/* ── RIGHT: related videos ───────────────────────────────────── */}
          <div className={`flex-shrink-0 ${theater ? "hidden" : "w-[360px]"}`}>
            <h2 className="text-sm font-semibold text-foreground mb-4">Up Next</h2>
            <div className="space-y-3">
              {related.length === 0 ? (
                <p className="text-sm text-muted-foreground">No other videos yet.</p>
              ) : related.map((v) => {
                const rid = getYouTubeVideoId(v.youtube_url)
                const thumb = v.thumbnail_url || `https://img.youtube.com/vi/${rid}/mqdefault.jpg`
                return (
                  <Link
                    key={v.id}
                    to={`/video-hub/${v.id}`}
                    className="flex gap-3 group rounded-xl p-2 hover:bg-secondary/50 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0 w-[160px] aspect-video rounded-lg overflow-hidden bg-muted">
                      <img
                        src={thumb}
                        alt={v.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${rid}/hqdefault.jpg` }}
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/30 transition-opacity">
                        <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center shadow">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      {v.duration && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                          {v.duration}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-1">
                        {v.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{v.channel_name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                        <span>{formatViews(v.views)} views</span>
                        <span>•</span>
                        <span>{formatTimeAgo(v.created_at)}</span>
                      </div>
                      {v.is_featured && (
                        <span className="text-[10px] text-yellow-500 mt-1 block">⭐ Featured</span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Back to hub */}
            <div className="mt-6 pt-4 border-t border-border">
              <Link to="/video-hub"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                ← Back to Video Hub
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ToplistFooter />
    </div>
  )
}
