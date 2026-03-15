import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import NavBar from "@/components/NavBar"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { videoHubService, VIDEO_CATEGORIES } from "@/lib/video-hub-data"
import { useAuth } from "@/lib/auth"

const SUBMIT_CATEGORIES = VIDEO_CATEGORIES.filter((c) => c.value !== "all")

export default function VideoHubSubmit() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    youtube_url: "",
    channel_name: "",
    channel_url: "",
    duration: "",
    category: "GENERAL",
    tags: "",
  })

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError("")
    try {
      await videoHubService.submitVideo(form, user.id)
      setSuccess(true)
      setForm({ title: "", description: "", youtube_url: "", channel_name: "", channel_url: "", duration: "", category: "GENERAL", tags: "" })
    } catch (e: any) {
      setError(e?.message || "Failed to submit video. The URL may already be submitted.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />

      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Submit a Video</h1>
            <p className="text-muted-foreground text-sm">Share RuneScape Private Server content with the community</p>
          </div>
          <Link to="/video-hub" className="text-sm border border-border px-4 py-2 rounded-lg hover:bg-secondary text-foreground transition-colors">
            ← Back to Videos
          </Link>
        </div>

        {success && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-5 py-4 rounded-xl">
            <p className="font-semibold mb-1">✅ Video Submitted!</p>
            <p className="text-sm">Your video is now live in the Video Hub.</p>
            <button onClick={() => navigate("/video-hub")} className="mt-3 text-sm underline">Go to Video Hub</button>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl p-8">
          {/* Guidelines */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <h3 className="font-semibold text-blue-400 mb-2">Submission Guidelines</h3>
            <ul className="text-sm text-blue-300/80 space-y-1">
              <li>• Videos must be related to RuneScape Private Servers</li>
              <li>• Only YouTube videos are supported</li>
              <li>• Duplicate submissions will be rejected</li>
              <li>• Keep content appropriate for all ages</li>
            </ul>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video Info */}
            <div className="bg-secondary/20 p-5 rounded-xl border border-border space-y-4">
              <h3 className="font-semibold text-foreground">Video Information</h3>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">YouTube URL *</label>
                <input
                  type="url" name="youtube_url" required
                  value={form.youtube_url} onChange={set}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Video Title *</label>
                <input
                  type="text" name="title" required maxLength={100}
                  value={form.title} onChange={set}
                  placeholder="Amazing RSPS PvP Montage"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  name="description" rows={3} maxLength={500}
                  value={form.description} onChange={set}
                  placeholder="Briefly describe your video..."
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category *</label>
                  <select
                    name="category" required value={form.category} onChange={set}
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                  >
                    {SUBMIT_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Duration</label>
                  <input
                    type="text" name="duration" value={form.duration} onChange={set}
                    placeholder="10:30"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">MM:SS or HH:MM:SS</p>
                </div>
              </div>
            </div>

            {/* Channel Info */}
            <div className="bg-secondary/20 p-5 rounded-xl border border-border space-y-4">
              <h3 className="font-semibold text-foreground">Channel Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Channel Name *</label>
                  <input
                    type="text" name="channel_name" required value={form.channel_name} onChange={set}
                    placeholder="Your Channel Name"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Channel URL</label>
                  <input
                    type="url" name="channel_url" value={form.channel_url} onChange={set}
                    placeholder="https://youtube.com/channel/..."
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-secondary/20 p-5 rounded-xl border border-border">
              <h3 className="font-semibold text-foreground mb-3">Tags</h3>
              <input
                type="text" name="tags" value={form.tags} onChange={set}
                placeholder="pvp, osrs, 317, pking"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1.5">Separate tags with commas</p>
            </div>

            <div className="flex justify-end gap-3">
              <Link to="/video-hub" className="px-5 py-2.5 border border-border rounded-lg hover:bg-secondary text-foreground transition-colors text-sm">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <>📹 Submit Video</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToplistFooter />
    </div>
  )
}
