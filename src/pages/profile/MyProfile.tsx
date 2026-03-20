import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/lib/auth"
import { profileService } from "@/lib/profile-data"

export default function MyProfile() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        navigate("/login")
        return
      }
      const profile = await profileService.getById(user.id)
      if (profile?.username) {
        navigate(`/u/${profile.username}`, { replace: true })
      } else {
        navigate("/")
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
