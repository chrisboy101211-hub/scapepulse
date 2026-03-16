import { supabase } from "./supabase"

export interface Profile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  border_effect: string
  profile_color: string
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface ProfileComment {
  id: number
  profile_id: string
  author_id: string
  author_name: string
  author_avatar: string | null
  content: string
  created_at: string
}

export interface ProfileReputation {
  id: number
  profile_id: string
  giver_id: string
  type: 'positive' | 'negative'
  reason: string | null
  created_at: string
}

export type BorderEffect =
  | 'none' | 'solid' | 'glow'
  | 'rainbow' | 'electric' | 'fire' | 'ice' | 'holographic' | 'gold' | 'neon-green' | 'neon-purple'

export const BORDER_EFFECTS: { id: BorderEffect; label: string; premium: boolean; preview: string }[] = [
  { id: 'none',        label: 'None',        premium: false, preview: 'border-2 border-border/40' },
  { id: 'solid',       label: 'Solid',       premium: false, preview: 'border-2 border-primary' },
  { id: 'glow',        label: 'Glow',        premium: false, preview: 'border-2 border-primary shadow-[0_0_10px_rgba(0,255,240,0.6)]' },
  { id: 'rainbow',     label: 'Rainbow',     premium: true,  preview: 'avatar-border-rainbow' },
  { id: 'electric',    label: 'Electric',    premium: true,  preview: 'avatar-border-electric' },
  { id: 'fire',        label: 'Fire',        premium: true,  preview: 'avatar-border-fire' },
  { id: 'ice',         label: 'Ice',         premium: true,  preview: 'avatar-border-ice' },
  { id: 'holographic', label: 'Holographic', premium: true,  preview: 'avatar-border-holographic' },
  { id: 'gold',        label: 'Gold',        premium: true,  preview: 'avatar-border-gold' },
  { id: 'neon-green',  label: 'Neon Green',  premium: true,  preview: 'avatar-border-neon-green' },
  { id: 'neon-purple', label: 'Neon Purple', premium: true,  preview: 'avatar-border-neon-purple' },
]

async function uploadProfileAsset(file: File, userId: string, slot: 'avatar' | 'banner'): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${userId}/${slot}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('profile-assets').upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from('profile-assets').getPublicUrl(path)
  return data.publicUrl
}

export const profileService = {
  uploadProfileAsset,

  async getByUsername(username: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('username', username).single()
    return data as Profile | null
  },

  async getById(id: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    return data as Profile | null
  },

  async upsert(profile: Partial<Profile> & { id: string }): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ ...profile, updated_at: new Date().toISOString() })
      .select().single()
    if (error) throw error
    return data as Profile
  },

  async getComments(profileId: string): Promise<ProfileComment[]> {
    const { data } = await supabase
      .from('profile_comments').select('*')
      .eq('profile_id', profileId).order('created_at', { ascending: false })
    return (data ?? []) as ProfileComment[]
  },

  async postComment(profileId: string, authorId: string, authorName: string, authorAvatar: string | null, content: string): Promise<ProfileComment> {
    const { data, error } = await supabase
      .from('profile_comments')
      .insert({ profile_id: profileId, author_id: authorId, author_name: authorName, author_avatar: authorAvatar, content: content.trim() })
      .select().single()
    if (error) throw error
    return data as ProfileComment
  },

  async deleteComment(commentId: number): Promise<void> {
    await supabase.from('profile_comments').delete().eq('id', commentId)
  },

  async getReputation(profileId: string): Promise<{ positive: number; negative: number; total: number; records: ProfileReputation[] }> {
    const { data } = await supabase.from('profile_reputation').select('*').eq('profile_id', profileId)
    const records = (data ?? []) as ProfileReputation[]
    const positive = records.filter(r => r.type === 'positive').length
    const negative = records.filter(r => r.type === 'negative').length
    return { positive, negative, total: positive - negative, records }
  },

  async getUserRepGiven(profileId: string, giverId: string): Promise<ProfileReputation | null> {
    const { data } = await supabase.from('profile_reputation').select('*').eq('profile_id', profileId).eq('giver_id', giverId).single()
    return data as ProfileReputation | null
  },

  async giveReputation(profileId: string, giverId: string, type: 'positive' | 'negative', reason?: string): Promise<void> {
    await supabase.from('profile_reputation').upsert({ profile_id: profileId, giver_id: giverId, type, reason: reason ?? null })
  },

  async removeReputation(profileId: string, giverId: string): Promise<void> {
    await supabase.from('profile_reputation').delete().eq('profile_id', profileId).eq('giver_id', giverId)
  },
}
