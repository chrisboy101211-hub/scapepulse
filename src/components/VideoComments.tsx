import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { videoHubService, type VideoComment } from "@/lib/video-hub-data"
import { formatTimeAgo } from "@/lib/video-hub-data"

interface VideoCommentsProps {
  videoId: string
}

export function VideoComments({ videoId }: VideoCommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<VideoComment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    videoHubService.getComments(videoId)
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [videoId])

  const displayName = user
    ? (user.user_metadata?.full_name as string | undefined) ||
      (user.email?.split("@")[0] ?? "User")
    : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !text.trim()) return
    setSubmitting(true)
    setError("")
    try {
      const comment = await videoHubService.postComment(videoId, user.id, displayName, text)
      setComments((prev) => [...prev, comment])
      setText("")
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
    } catch (e: any) {
      setError(e?.message || "Failed to post comment.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await videoHubService.deleteComment(id)
      setComments((prev) => prev.filter((c) => c.id !== id))
    } catch {}
  }

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        💬 Comments
        <span className="text-xs text-muted-foreground font-normal bg-secondary px-2 py-0.5 rounded-full">
          {comments.length}
        </span>
      </h3>

      {/* Comment list */}
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-3 group">
              {/* Avatar */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {c.display_name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground truncate">{c.display_name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{formatTimeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{c.content}</p>
              </div>

              {/* Delete (own comment) */}
              {user?.id === c.user_id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted-foreground hover:text-destructive transition-all text-xs mt-0.5"
                  title="Delete comment"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Post comment */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              maxLength={1000}
              disabled={submitting}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Post"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-2">
          <span className="text-primary font-medium">Sign in</span> to leave a comment.
        </p>
      )}

      {error && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}
    </div>
  )
}
