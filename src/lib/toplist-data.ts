import { supabase } from "./supabase"

export interface ToplistServer {
  id: number
  user_id: string
  name: string
  website: string
  discord_invite: string | null
  description: string
  short_description: string | null
  revision: string
  server_type: string
  experience_rate: string | null
  player_count: string | null
  tags: string[] | string
  image_url: string | null
  banner_url: string | null
  features: string | null
  custom_content: string | null
  staff_info: string | null
  rules: string | null
  vote_link: string | null
  votes: number
  monthly_votes: number
  is_premium: boolean
  is_top10: boolean
  is_sponsor: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  // Computed/joined
  average_rating?: number
  total_reviews?: number
  owner_name?: string | null
}

export interface ToplistVote {
  id: number
  server_id: number
  user_id: string | null
  ip_address: string | null
  vote_site: string
  created_at: string
}

export interface ToplistReview {
  id: number
  server_id: number
  user_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  user_name?: string | null
}

export interface ToplistAdvertisement {
  id: string
  title: string
  description: string | null
  image_url: string
  target_url: string
  type: string
  position: string
  is_active: boolean
}

export interface ToplistTickerMessage {
  id: string
  message: string
  priority: number
}

export const toplistDataService = {
  async getServers(filters?: {
    search?: string
    revision?: string
    serverType?: string
    page?: number
    limit?: number
  }) {
    const page = filters?.page || 1
    const limit = filters?.limit || 35
    const offset = (page - 1) * limit

    let query = supabase
      .from("toplist_servers")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .eq("is_top10", false)
      .order("votes", { ascending: false })
      .range(offset, offset + limit - 1)

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    if (filters?.revision) {
      query = query.eq("revision", filters.revision)
    }
    if (filters?.serverType) {
      query = query.eq("server_type", filters.serverType)
    }

    const { data, error, count } = await query
    if (error) throw error

    return {
      servers: data || [],
      pagination: {
        page,
        limit,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }
  },

  async getTop10Servers() {
    const { data, error } = await supabase
      .from("toplist_servers")
      .select("*")
      .eq("is_active", true)
      .eq("is_top10", true)
      .order("votes", { ascending: false })
      .limit(10)
    if (error) throw error
    return data || []
  },

  async getServer(id: number) {
    const { data, error } = await supabase
      .from("toplist_servers")
      .select("*")
      .eq("id", id)
      .single()
    if (error) return null
    return data as ToplistServer
  },

  async createServer(server: Omit<ToplistServer, "id" | "votes" | "monthly_votes" | "is_premium" | "is_top10" | "is_sponsor" | "is_active" | "created_at" | "updated_at">) {
    const { data, error } = await supabase
      .from("toplist_servers")
      .insert(server)
      .select()
      .single()
    if (error) throw error
    return data as ToplistServer
  },

  async getUserServer(userId: string) {
    const { data } = await supabase
      .from("toplist_servers")
      .select("id")
      .eq("user_id", userId)
      .single()
    return data
  },

  async voteForServer(serverId: number, userId?: string) {
    // Insert vote
    const { error: voteError } = await supabase
      .from("toplist_votes")
      .insert({ server_id: serverId, user_id: userId || null })

    if (voteError) throw voteError

    // Increment vote count
    const { error: updateError } = await supabase.rpc("increment_toplist_votes", {
      server_id_param: serverId,
    })

    // Fallback: direct update if RPC not available
    if (updateError) {
      const { data: current } = await supabase
        .from("toplist_servers")
        .select("votes, monthly_votes")
        .eq("id", serverId)
        .single()

      if (current) {
        await supabase
          .from("toplist_servers")
          .update({ votes: current.votes + 1, monthly_votes: current.monthly_votes + 1 })
          .eq("id", serverId)
      }
    }
  },

  async bumpServer(serverId: number, userId?: string) {
    const { error } = await supabase
      .from("toplist_server_bumps")
      .insert({ server_id: serverId, user_id: userId || null })
    if (error) throw error
  },

  async getReviews(serverId: number) {
    const { data, error } = await supabase
      .from("toplist_server_reviews")
      .select("*")
      .eq("server_id", serverId)
      .order("created_at", { ascending: false })
      .limit(20)
    if (error) return []

    // Get stats
    const total = data?.length || 0
    const avg = total > 0
      ? data.reduce((sum, r) => sum + r.rating, 0) / total
      : 0

    return {
      reviews: data || [],
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: total,
    }
  },

  async upsertReview(review: { server_id: number; user_id: string; rating: number; comment?: string }) {
    const { error } = await supabase
      .from("toplist_server_reviews")
      .upsert(review, { onConflict: "server_id,user_id" })
    if (error) throw error
  },

  async getAdvertisements(position: string) {
    const { data } = await supabase
      .from("toplist_advertisements")
      .select("*")
      .eq("position", position)
      .eq("is_active", true)
      .limit(1)
    return data || []
  },

  async getTickerMessages() {
    const { data } = await supabase
      .from("toplist_ticker_messages")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
    return data || []
  },

  /**
   * Submit a vote via the sp-toplist-vote edge function.
   * The edge function records the vote, fires the callback to the server's
   * callback_url (GET first, POST fallback — same as runespace), and inserts
   * into fx_votes for the Java SupabaseVoteProcessor.
   */
  async submitVote(serverId: number, username: string): Promise<{ newVoteCount: number }> {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    const res = await fetch(`${supabaseUrl}/functions/v1/sp-toplist-vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ server_id: serverId, username }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Vote failed")
    return { newVoteCount: data.newVoteCount }
  },
}
