import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cookie-based storage adapter — keeps the session alive across refreshes
// without relying solely on localStorage (which can be wiped by browsers).
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year in seconds

const cookieStorage = {
  getItem(key: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(key)}=([^;]*)`))
    return match ? decodeURIComponent(match[1]) : null
  },
  setItem(key: string, value: string): void {
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
  },
  removeItem(key: string): void {
    document.cookie = `${encodeURIComponent(key)}=; path=/; max-age=0; SameSite=Lax`
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sp-auth',
    storage: cookieStorage,
  },
})
