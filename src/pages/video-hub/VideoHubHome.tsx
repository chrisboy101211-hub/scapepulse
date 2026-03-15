import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import NavBar from "@/components/NavBar"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { VideoLikeButton } from "@/components/VideoLikeButton"
import { videoHubService, VIDEO_CATEGORIES, getYouTubeVideoId, formatViews, formatTimeAgo, type Video } from "@/lib/video-hub-data"
import { useAuth } from "@/lib/auth"

export default function VideoHubHome() {
  const { user } = useAuth()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  const fetchVideos = useCallback(async () => {
    setLoading(true)
    try {
      const result = await videoHubService.getVideos({
        category,
        search,
        page,
        limit: 12,
        userId: user?.id,
      })
      setVideos(result.videos)
      setTotalPages(result.pagination.totalPages)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [category, page, user?.id])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  // Close modal on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelectedVideo(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handleSearch = () => { setPage(1); fetchVideos() }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Video Hub
            </h1>
            <p className="text-muted-foreground">
              Discover the latest RuneScape Private Server content from creators
            </p>
          </div>
          <Link
            to="/video-hub/submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors text-sm"
          >
            📹 Submit Video
          </Link>
        </div>

        {/* Search & Filters */}
        <div className="bg-card/80 backdrop-blur-sm p-5 rounded-2xl border border-border mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex flex-1 gap-2">
              <input
                type="text"
                placeholder="Search videos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 border border-border rounded-lg hover:bg-secondary text-foreground transition-colors text-sm"
              >
                Search
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {VIDEO_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setCategory(cat.value); setPage(1) }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    category === cat.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border animate-pulse">
                <div className="aspect-video bg-muted rounded-t-2xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📹</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">No Videos Found</h2>
            <p className="text-muted-foreground mb-6">
              {search || category !== "all"
                ? "Try adjusting your search or filter."
                : "Be the first to submit a video!"}
            </p>
            <Link to="/video-hub/submit" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors">
              Submit First Video
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {videos.map((video) => {
                const vid = getYouTubeVideoId(video.youtube_url)
                const thumb = video.thumbnail_url || `https://img.youtube.com/vi/${vid}/maxresdefault.jpg`
                return (
                  <div key={video.id} className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:scale-[1.02] transition-all duration-300">
                    {/* Thumbnail */}
                    <div
                      className="relative aspect-video bg-muted cursor-pointer overflow-hidden"
                      onClick={() => setSelectedVideo(video)}
                    >
                      <img
                        src={thumb}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.src = `https://img.youtube.com/vi/${vid}/hqdefault.jpg` }}
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                          <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      {video.is_featured && (
                        <span className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold">⭐ Featured</span>
                      )}
                      {video.duration && (
                        <span className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-0.5 rounded text-xs">{video.duration}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3
                        className="font-semibold text-foreground mb-1.5 line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
                        onClick={() => setSelectedVideo(video)}
                      >
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                        {video.channel_url ? (
                          <a href={video.channel_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors truncate">
                            {video.channel_name}
                          </a>
                        ) : (
                          <span className="truncate">{video.channel_name}</span>
                        )}
                        <span className="text-xs flex-shrink-0 ml-2">{formatTimeAgo(video.created_at)}</span>
                      </div>
                      {video.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{video.description}</p>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-secondary px-2 py-0.5 rounded capitalize">{video.category.toLowerCase()}</span>
                          <span>{formatViews(video.views)} views</span>
                        </div>
                        <button
                          onClick={() => setSelectedVideo(video)}
                          className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-secondary text-foreground transition-colors"
                        >
                          Watch
                        </button>
                      </div>
                      <div className="pt-3 border-t border-border">
                        <VideoLikeButton
                          videoId={video.id}
                          initialLikes={video.likes}
                          initialDislikes={video.dislikes}
                          initialUserVote={video.user_vote}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const n = page <= 3 ? i + 1 : page - 2 + i
                  if (n > totalPages) return null
                  return (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === n ? "bg-primary text-primary-foreground" : "border border-border hover:bg-secondary text-foreground"
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="relative w-full max-w-4xl my-8 bg-card rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="aspect-video bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYouTubeVideoId(selectedVideo.youtube_url)}?autoplay=1`}
                title={selectedVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            <div className="p-6 border-t border-border">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground mb-1">{selectedVideo.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {selectedVideo.channel_url ? (
                      <a href={selectedVideo.channel_url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground font-medium transition-colors">
                        {selectedVideo.channel_name}
                      </a>
                    ) : (
                      <span className="font-medium">{selectedVideo.channel_name}</span>
                    )}
                    <span>•</span>
                    <span>{formatViews(selectedVideo.views)} views</span>
                    <span>•</span>
                    <span>{formatTimeAgo(selectedVideo.created_at)}</span>
                    <span className="bg-secondary px-2 py-0.5 rounded capitalize text-xs">
                      {selectedVideo.category.toLowerCase()}
                    </span>
                  </div>
                </div>
                <a
                  href={selectedVideo.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary text-sm text-foreground transition-colors"
                >
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                  YouTube
                </a>
              </div>

              {selectedVideo.description && (
                <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">{selectedVideo.description}</p>
              )}

              <div className="pt-3 border-t border-border">
                <VideoLikeButton
                  videoId={selectedVideo.id}
                  initialLikes={selectedVideo.likes}
                  initialDislikes={selectedVideo.dislikes}
                  initialUserVote={selectedVideo.user_vote}
                  size="md"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <ToplistFooter />
    </div>
  )
}
