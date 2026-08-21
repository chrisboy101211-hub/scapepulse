import { supabase } from "./supabase"

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value))
}

export async function signInWithUsername(username: string, password: string) {
  const { data, error } = await supabase.functions.invoke("username-sign-in", {
    body: { username: normalizeUsername(username), password },
  })

  if (error || data?.error) throw new Error(data?.error || "Unable to sign in")
  if (!data?.session?.access_token || !data?.session?.refresh_token) {
    throw new Error("Unable to sign in")
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
  if (sessionError) throw sessionError
}
