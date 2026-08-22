import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { videoHubService } from "@/lib/video-hub-data"

interface VideoLikeButtonProps {
  videoId: string
  initialLikes: number
  initialDislikes: number
  initialUserVote?: "LIKE" | "DISLIKE" | null
  size?: "sm" | "md" | "lg"
}

export function VideoLikeButton({
  videoId,
  initialLikes,
  initialDislikes,
  initialUserVote = null,
  size = "sm",
}: VideoLikeButtonProps) {
  const { user } = useAuth()
  const [likes, setLikes] = useState(initialLikes)
  const [dislikes, setDislikes] = useState(initialDislikes)
  const [userVote, setUserVote] = useState<"LIKE" | "DISLIKE" | null>(initialUserVote)
  const [loading, setLoading] = useState(false)

  const handle = async (type: "LIKE" | "DISLIKE") => {
    if (!user) return
    setLoading(true)
    try {
      const result = await videoHubService.likeVideo(videoId, user.id, type)
      setLikes(result.likes)
      setDislikes(result.dislikes)
      setUserVote(result.userVote)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const btnClass = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-2",
  }[size]

  const iconClass = { sm: "text-sm", md: "text-base", lg: "text-lg" }[size]

  if (!user) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">👍 {likes}</span>
        <span className="text-muted-foreground">👎 {dislikes}</span>
        <Link to="/login" className="font-medium text-primary hover:text-primary/80">Log in to react</Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handle("LIKE")}
        disabled={loading || Boolean(userVote)}
        title={userVote ? "You have already reacted to this video" : undefined}
        className={`${btnClass} flex items-center gap-1 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          userVote === "LIKE"
            ? "text-green-500 bg-green-500/10 hover:bg-green-500/20"
            : "text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
        }`}
      >
        <span className={iconClass}>👍</span>
        <span>{likes}</span>
      </button>

      <button
        onClick={() => handle("DISLIKE")}
        disabled={loading || Boolean(userVote)}
        title={userVote ? "You have already reacted to this video" : undefined}
        className={`${btnClass} flex items-center gap-1 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          userVote === "DISLIKE"
            ? "text-red-500 bg-red-500/10 hover:bg-red-500/20"
            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
        }`}
      >
        <span className={iconClass}>👎</span>
        <span>{dislikes}</span>
      </button>
    </div>
  )
}
