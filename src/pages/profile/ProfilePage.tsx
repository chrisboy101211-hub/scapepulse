import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import NavBar from "@/components/NavBar"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { AvatarBorder } from "@/components/AvatarBorder"
import { profileService, type Profile, type ProfileComment, type BorderEffect } from "@/lib/profile-data"
import { toplistDataService } from "@/lib/toplist-data"
import { videoHubService, getYouTubeVideoId, formatViews, formatTimeAgo, type Video } from "@/lib/video-hub-data"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { ThumbsUp, ThumbsDown, Crown, Calendar, MessageSquare, Star } from "lucide-react"

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [rep, setRep] = useState({ positive: 0, negative: 0, total: 0 })
  const [myRep, setMyRep] = useState<'positive' | 'negative' | null>(null)
  const [comments, setComments] = useState<ProfileComment[]>([])
  const [commentText, setCommentText] = useState("")
  const [posting, setPosting] = useState(false)
  const [server, setServer] = useState<any>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [videoCount, setVideoCount] = useState(0)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!username) return
    setLoading(true)
    profileService.getByUsername(username).then(async (p) => {
      if (!p) { setNotFound(true); setLoading(false); return }
      setProfile(p)

      // Load in parallel
      const [repData, commentsData, serverData, videosResult] = await Promise.all([
        profileService.getReputation(p.id),
        profileService.getComments(p.id),
        toplistDataService.getUserServer(p.id),
        supabase.from("videos").select("*", { count: "exact" }).eq("submitter_id", p.id).eq("is_approved", true).order("views", { ascending: false }).limit(6),
      ])

      setRep({ positive: repData.positive, negative: repData.negative, total: repData.total })
      setComments(commentsData)
      setServer(serverData)
      setVideos((videosResult.data ?? []) as Video[])
      setVideoCount(videosResult.count ?? 0)

      if (user && user.id !== p.id) {
        const given = await profileService.getUserRepGiven(p.id, user.id)
        setMyRep(given?.type ?? null)
      }
      setLoading(false)
    })
  }, [username, user])

  const handleRep = async (type: 'positive' | 'negative') => {
    if (!user || !profile || user.id === profile.id) return
    if (myRep === type) {
      await profileService.removeReputation(profile.id, user.id)
      setMyRep(null)
      setRep(r => ({
        ...r,
        positive: type === 'positive' ? r.positive - 1 : r.positive,
        negative: type === 'negative' ? r.negative - 1 : r.negative,
        total: type === 'positive' ? r.total - 1 : r.total + 1,
      }))
    } else {
      const prev = myRep
      await profileService.giveReputation(profile.id, user.id, type)
      setMyRep(type)
      setRep(r => ({
        positive: type === 'positive' ? r.positive + 1 : prev === 'positive' ? r.positive - 1 : r.positive,
        negative: type === 'negative' ? r.negative + 1 : prev === 'negative' ? r.negative - 1 : r.negative,
        total: type === 'positive' ? r.total + 1 : r.total - 1,
      }))
    }
  }

  const postComment = async () => {
    if (!user || !profile || !commentText.trim()) return
    setPosting(true)
    try {
      const userProfile = await profileService.getById(user.id)
      const c = await profileService.postComment(
        profile.id, user.id,
        userProfile?.display_name || user.email?.split("@")[0] || "Anonymous",
        userProfile?.avatar_url ?? null,
        commentText.trim()
      )
      setComments(prev => [c, ...prev])
      setCommentText("")
    } finally {
      setPosting(false)
    }
  }

  const deleteComment = async (id: number) => {
    await profileService.deleteComment(id)
    setComments(prev => prev.filter(c => c.id !== id))
  }

  if (loading) return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (notFound || !profile) return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-6 py-20 text-center">
        <p className="text-2xl font-bold text-foreground mb-2">Profile not found</p>
        <p className="text-muted-foreground">This user doesn't exist or hasn't set up their profile yet.</p>
      </div>
    </div>
  )

  const repColor = rep.total > 0 ? "text-green-400" : rep.total < 0 ? "text-red-400" : "text-muted-foreground"

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      {/* Banner */}
      <div className="relative w-full h-[220px] overflow-hidden">
        {profile.banner_url ? (
          <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{
            background: `linear-gradient(135deg, ${profile.profile_color}22 0%, #0f0f1a 60%, ${profile.profile_color}11 100%)`
          }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-6 max-w-5xl">
        {/* Avatar + name row */}
        <div className="flex items-end gap-5 -mt-14 mb-4 relative z-10">
          <AvatarBorder
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name || profile.username || "?"}
            borderEffect={profile.border_effect as BorderEffect}
            profileColor={profile.profile_color}
            size={96}
          />
          <div className="pb-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground leading-tight">
                {profile.display_name || profile.username}
              </h1>
              {profile.is_premium && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded text-xs text-yellow-400 font-semibold">
                  <Crown className="w-3 h-3" /> Premium
                </span>
              )}
              <span className={`text-lg font-bold ${repColor}`}>
                {rep.total > 0 ? "+" : ""}{rep.total}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
          </div>

          {/* Reputation buttons */}
          {user && user.id !== profile.id && (
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={() => handleRep('positive')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${myRep === 'positive' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'border-border/50 text-muted-foreground hover:text-green-400 hover:border-green-500/40'}`}
              >
                <ThumbsUp className="w-3.5 h-3.5" /> {rep.positive}
              </button>
              <button
                onClick={() => handleRep('negative')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${myRep === 'negative' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'border-border/50 text-muted-foreground hover:text-red-400 hover:border-red-500/40'}`}
              >
                <ThumbsDown className="w-3.5 h-3.5" /> {rep.negative}
              </button>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-foreground/80 mb-5 max-w-2xl leading-relaxed">{profile.bio}</p>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mb-8 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Joined {formatDate(profile.created_at)}</span>
          </div>
          {videoCount > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              <span>{videoCount} video{videoCount !== 1 ? "s" : ""}</span>
            </div>
          )}
          {server && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="w-3.5 h-3.5" />
              <span>{server.votes?.toLocaleString() ?? 0} toplist votes</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{comments.length} comment{comments.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Toplist Server */}
            {server && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">Toplist Server</h2>
                <Link to={`/toplist/servers/${server.id}`}
                  className="flex items-center gap-4 p-4 border border-border/40 rounded-xl bg-card/50 hover:border-primary/40 transition-colors group">
                  {server.image_url && (
                    <img src={server.image_url} alt={server.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{server.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{server.short_description || server.revision}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-primary">{(server.votes ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">votes</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">Videos</h2>
                <div className="grid grid-cols-2 gap-3">
                  {videos.map(v => {
                    const vid = getYouTubeVideoId(v.youtube_url)
                    const thumb = v.thumbnail_url || `https://img.youtube.com/vi/${vid}/mqdefault.jpg`
                    return (
                      <Link key={v.id} to={`/video-hub/${v.id}`}
                        className="group rounded-lg overflow-hidden border border-border/40 hover:border-primary/40 transition-colors bg-card/50">
                        <div className="relative aspect-video bg-muted">
                          <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {formatViews(v.views)} views
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">{v.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{formatTimeAgo(v.created_at)}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                {videoCount > 6 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">+{videoCount - 6} more videos</p>
                )}
              </div>
            )}

            {/* Comment board */}
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">
                Profile Comments ({comments.length})
              </h2>

              {user ? (
                <div className="flex gap-3 mb-4">
                  <textarea
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder={`Leave a comment on ${profile.display_name || profile.username}'s profile…`}
                    rows={2}
                    maxLength={500}
                    className="flex-1 px-3 py-2 bg-secondary/40 border border-border/60 rounded text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/20 resize-none transition-colors"
                  />
                  <button onClick={postComment} disabled={posting || !commentText.trim()}
                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm font-medium disabled:opacity-50 transition-colors self-end">
                    {posting ? "…" : "Post"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  <Link to="/login" className="text-primary hover:underline">Log in</Link> to leave a comment.
                </p>
              )}

              <div className="space-y-3">
                {comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first!</p>
                )}
                {comments.map(c => (
                  <div key={c.id} className="flex gap-3 p-3 border border-border/30 rounded-lg bg-card/30 group">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {c.author_avatar ? (
                        <img src={c.author_avatar} alt={c.author_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary">{c.author_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-foreground">{c.author_name}</span>
                        <span className="text-xs text-muted-foreground">{formatTimeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">{c.content}</p>
                    </div>
                    {user && (user.id === c.author_id || user.id === profile.id) && (
                      <button onClick={() => deleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive transition-all flex-shrink-0 self-start mt-0.5">
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* Right sidebar — info card */}
          <div className="space-y-4">
            <div className="border border-border/40 rounded-xl p-4 bg-card/50">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">About</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reputation</span>
                  <span className={`font-semibold ${repColor}`}>{rep.total > 0 ? "+" : ""}{rep.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Positive</span>
                  <span className="text-green-400 font-medium">{rep.positive}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Negative</span>
                  <span className="text-red-400 font-medium">{rep.negative}</span>
                </div>
                <div className="border-t border-border/30 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="text-foreground">{formatDate(profile.created_at)}</span>
                  </div>
                </div>
                {profile.is_premium && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="flex items-center gap-1.5 text-yellow-400">
                      <Crown className="w-3.5 h-3.5" />
                      <span className="text-xs font-semibold">Premium Member</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="py-10" />
      </div>

      <ToplistFooter />
    </div>
  )
}
