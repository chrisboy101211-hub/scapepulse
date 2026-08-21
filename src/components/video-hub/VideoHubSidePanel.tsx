import { useEffect, useState } from "react"
import { Clock3, Heart, Play } from "lucide-react"
import { Link } from "react-router-dom"
import { formatTimeAgo, getYouTubeVideoId, videoHubService, type Video } from "@/lib/video-hub-data"

type VideoHubSidePanelProps = {
  kind: "latest" | "likes"
}

export function VideoHubSidePanel({ kind }: VideoHubSidePanelProps) {
  const [videos, setVideos] = useState<Video[]>([])
  const latest = kind === "latest"

  useEffect(() => {
    videoHubService.getSidebarVideos(latest ? "latest" : "likes")
      .then(setVideos)
      .catch(() => setVideos([]))
  }, [latest])

  return (
    <section className="border border-border/70 bg-card/70 p-2.5 shadow-lg shadow-black/10 backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        {latest ? <Clock3 className="h-4 w-4 text-violet-300" /> : <Heart className="h-4 w-4 fill-current text-rose-300" />}
        <h2 className="font-display text-sm font-bold text-foreground">{latest ? "Latest Videos" : "Top Videos by Likes"}</h2>
      </div>

      <div className="space-y-1.5">
        {videos.length === 0 ? (
          [...Array(5)].map((_, index) => <div key={index} className="h-14 animate-pulse border border-border/40 bg-background/30" />)
        ) : videos.map((video) => {
          const videoId = getYouTubeVideoId(video.youtube_url)
          const thumbnail = video.thumbnail_url || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "")

          return (
            <article key={video.id} className="group relative min-h-14 overflow-hidden border border-border/55 bg-background/40 p-1.5 transition-colors hover:border-primary/50 hover:bg-secondary/45">
              <div className="flex items-center gap-2 transition-opacity group-hover:opacity-20">
                <span className="flex h-8 w-12 shrink-0 overflow-hidden border border-primary/20 bg-card">
                  {thumbnail ? <img src={thumbnail} alt="" className="h-full w-full object-cover" /> : <img src="/favicon.svg" alt="" className="m-auto h-5 w-5" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-semibold text-foreground">{video.title}</span>
                  <span className="block text-[10px] text-muted-foreground">{latest ? formatTimeAgo(video.created_at) : `${video.likes.toLocaleString()} likes`}</span>
                </span>
              </div>
              <Link to={`/video-hub/${video.id}`} className="absolute inset-0 flex items-center justify-center gap-1 bg-card/92 px-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <Play className="h-3 w-3 fill-current text-primary" />
                <span className="text-[10px] font-bold text-primary">Watch video</span>
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
