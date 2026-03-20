import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

export default function MyProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        navigate("/login")
        return
      }
      
      // Try to get the user's profile by their auth ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single()
      
      if (profile?.username) {
        navigate(`/u/${profile.username}`, { replace: true })
      } else {
        // No profile found, redirect to settings to create one
        navigate("/dashboard/profile", { replace: true })
      }
    }
    loadProfile()
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
