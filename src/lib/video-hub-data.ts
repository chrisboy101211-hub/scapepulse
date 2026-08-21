import { supabase } from "./supabase"

export interface Video {
  id: string
  submitter_id: string | null
  title: string
  description: string | null
  youtube_url: string
  thumbnail_url: string | null
  channel_name: string
  channel_url: string | null
  duration: string | null
  category: string
  tags: string[]
  is_approved: boolean
  is_featured: boolean
  views: number
  likes: number
  dislikes: number
  created_at: string
  updated_at: string
  user_vote?: "LIKE" | "DISLIKE" | null
}

export interface VideoComment {
  id: string
  video_id: string
  user_id: string
  display_name: string
  content: string
  created_at: string
}

export type VideoCategory = "GENERAL" | "PVP" | "PVM" | "GUIDES" | "REVIEWS" | "UPDATES" | "MONTAGES"

export const VIDEO_CATEGORIES = [
  { value: "all",      label: "All Videos" },
  { value: "GENERAL",  label: "General" },
  { value: "PVP",      label: "PvP" },
  { value: "PVM",      label: "PvM" },
  { value: "GUIDES",   label: "Guides" },
  { value: "REVIEWS",  label: "Reviews" },
  { value: "UPDATES",  label: "Updates" },
  { value: "MONTAGES", label: "Montages" },
]

export function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return views.toString()
}

export function formatTimeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

export const videoHubService = {
  async getVideos(opts?: {
    category?: string
    search?: string
    page?: number
    limit?: number
    userId?: string
  }) {
    const page = opts?.page ?? 1
    const limit = opts?.limit ?? 12
    const offset = (page - 1) * limit

    let query = supabase
      .from("videos")
      .select("*", { count: "exact" })
      .eq("is_approved", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (opts?.category && opts.category !== "all") {
      query = query.eq("category", opts.category)
    }

    if (opts?.search) {
      query = query.or(
        `title.ilike.%${opts.search}%,description.ilike.%${opts.search}%,channel_name.ilike.%${opts.search}%`
      )
    }

    const { data, error, count } = await query
    if (error) throw error

    let videos = (data ?? []) as Video[]

    // Attach user vote if logged in
    if (opts?.userId && videos.length > 0) {
      const ids = videos.map((v) => v.id)
      const { data: likesData } = await supabase
        .from("video_likes")
        .select("video_id, type")
        .eq("user_id", opts.userId)
        .in("video_id", ids)

      const voteMap = Object.fromEntries(
        (likesData ?? []).map((l: any) => [l.video_id, l.type])
      )
      videos = videos.map((v) => ({ ...v, user_vote: voteMap[v.id] ?? null }))
    }

    return {
      videos,
      pagination: {
        page,
        limit,
        totalCount: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    }
  },

  async getSidebarVideos(sort: "latest" | "likes", limit = 5): Promise<Video[]> {
    let query = supabase
      .from("videos")
      .select("*")
      .eq("is_approved", true)

    query = sort === "likes"
      ? query.order("likes", { ascending: false }).order("created_at", { ascending: false })
      : query.order("created_at", { ascending: false })

    const { data, error } = await query.limit(limit)
    if (error) throw error
    return (data ?? []) as Video[]
  },

  async getRelatedVideos(excludeId: string, limit = 15): Promise<Video[]> {
    const { data } = await supabase
      .from("videos")
      .select("*")
      .eq("is_approved", true)
      .neq("id", excludeId)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit)
    return (data ?? []) as Video[]
  },

  async getVideo(id: string, userId?: string): Promise<Video | null> {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("is_approved", true)
      .single()

    if (error || !data) return null

    let user_vote: "LIKE" | "DISLIKE" | null = null
    if (userId) {
      const { data: like } = await supabase
        .from("video_likes")
        .select("type")
        .eq("user_id", userId)
        .eq("video_id", id)
        .single()
      user_vote = (like?.type as any) ?? null
    }

    return { ...data, user_vote } as Video
  },

  async submitVideo(video: {
    title: string
    description: string
    youtube_url: string
    channel_name: string
    channel_url: string
    duration: string
    category: string
    tags: string
  }, userId: string) {
    const videoId = getYouTubeVideoId(video.youtube_url)
    if (!videoId) throw new Error("Invalid YouTube URL")

    const thumbnail_url = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    const tags = video.tags
      ? video.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : []

    const { data, error } = await supabase
      .from("videos")
      .insert({
        submitter_id: userId,
        title: video.title,
        description: video.description || null,
        youtube_url: video.youtube_url,
        thumbnail_url,
        channel_name: video.channel_name,
        channel_url: video.channel_url || null,
        duration: video.duration || null,
        category: video.category,
        tags,
        is_approved: true,
      })
      .select()
      .single()

    if (error) throw error
    return data as Video
  },

  async getComments(videoId: string): Promise<VideoComment[]> {
    const { data, error } = await supabase
      .from("video_comments")
      .select("*")
      .eq("video_id", videoId)
      .order("created_at", { ascending: true })
    if (error) throw error
    return (data ?? []) as VideoComment[]
  },

  async postComment(videoId: string, userId: string, displayName: string, content: string): Promise<VideoComment> {
    const { data, error } = await supabase
      .from("video_comments")
      .insert({ video_id: videoId, user_id: userId, display_name: displayName, content: content.trim() })
      .select()
      .single()
    if (error) throw error
    return data as VideoComment
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from("video_comments").delete().eq("id", commentId)
    if (error) throw error
  },

  async likeVideo(videoId: string, userId: string, type: "LIKE" | "DISLIKE") {
    // Check existing vote
    const { data: existing } = await supabase
      .from("video_likes")
      .select("id, type")
      .eq("user_id", userId)
      .eq("video_id", videoId)
      .single()

    // Load current counts
    const { data: video } = await supabase
      .from("videos")
      .select("likes, dislikes")
      .eq("id", videoId)
      .single()

    if (!video) throw new Error("Video not found")

    let likes = video.likes
    let dislikes = video.dislikes
    let newVote: "LIKE" | "DISLIKE" | null = type

    if (existing) {
      if (existing.type === type) {
        // Toggle off
        await supabase.from("video_likes").delete().eq("id", existing.id)
        if (type === "LIKE") likes = Math.max(0, likes - 1)
        else dislikes = Math.max(0, dislikes - 1)
        newVote = null
      } else {
        // Switch vote
        await supabase.from("video_likes").update({ type }).eq("id", existing.id)
        if (type === "LIKE") { likes++; dislikes = Math.max(0, dislikes - 1) }
        else { dislikes++; likes = Math.max(0, likes - 1) }
      }
    } else {
      await supabase.from("video_likes").insert({ user_id: userId, video_id: videoId, type })
      if (type === "LIKE") likes++
      else dislikes++
    }

    await supabase.from("videos").update({ likes, dislikes }).eq("id", videoId)

    return { likes, dislikes, userVote: newVote }
  },
}
