import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { toplistDataService } from "@/lib/toplist-data"
import { useAuth } from "@/lib/auth"

const REVISION_OPTIONS = ["OSRS", "RS2", "RS3 (EOC)", "Custom/Modified", "Pre-EOC", "Legacy"]
const SERVER_TYPE_OPTIONS = ["Economy", "PvP", "PvM", "Skilling", "Custom", "Hardcore", "Ironman", "HCIM", "Spawn", "Hybrid", "Pure", "Max", "Completionist"]
const EXPERIENCE_RATE_OPTIONS = ["1x (Vanilla)", "2x", "5x", "10x", "25x", "50x", "100x", "200x", "500x", "1000x", "Custom"]
const PLAYER_COUNT_OPTIONS = ["0-50", "51-100", "101-250", "251-500", "501-1000", "1000+"]

export default function ToplistSubmitServer() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [existingServer, setExistingServer] = useState(false)
  const [formData, setFormData] = useState({
    name: "", website: "", discord_invite: "", description: "",
    short_description: "", revision: "", server_type: "",
    experience_rate: "", player_count: "", tags: "",
    image_url: "", banner_url: "", vote_link: "", callback_url: "",
  })

  useEffect(() => {
    if (!authLoading && !user) navigate("/login")
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (user) {
      toplistDataService.getUserServer(user.id).then(s => {
        if (s) setExistingServer(true)
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>, field: "image_url" | "banner_url") => {
    const file = e.target.files?.[0]
    if (!file) return
    const ab = await file.arrayBuffer()
    const bytes = new Uint8Array(ab)
    const b64 = btoa(bytes.reduce((d, b) => d + String.fromCharCode(b), ""))
    setFormData(prev => ({ ...prev, [field]: `data:${file.type};base64,${b64}` }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError("")
    try {
      const tagsArray = formData.tags ? formData.tags.split(",").map(t => t.trim()).filter(Boolean) : []
      await toplistDataService.createServer({
        user_id: user.id,
        name: formData.name,
        website: formData.website,
        discord_invite: formData.discord_invite || null,
        description: formData.description,
        short_description: formData.short_description || null,
        revision: formData.revision,
        server_type: formData.server_type,
        experience_rate: formData.experience_rate || null,
        player_count: formData.player_count || null,
        tags: tagsArray,
        image_url: formData.image_url || null,
        banner_url: formData.banner_url || null,
        features: null,
        custom_content: null,
        staff_info: null,
        rules: null,
        vote_link: formData.vote_link || null,
        callback_url: formData.callback_url || null,
      })
      navigate("/toplist?submitted=1")
    } catch (err: any) {
      setError(err?.message || "Failed to submit server")
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return null

  if (existingServer) {
    return (
      <div className="min-h-screen bg-background">
        <ToplistHeader />
        <div className="container mx-auto px-6 py-8 max-w-2xl">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-300 mb-2">Server Already Submitted</h2>
            <p className="text-blue-200 mb-4">Each account can only have one server listing.</p>
            <Link to="/toplist" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Back to Toplist
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ToplistHeader />
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Submit Your Server
          </h1>
          <p className="text-muted-foreground text-lg">Get your RSPS listed on ScapePulse Toplist</p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-border">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Server Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Website URL <span className="text-red-500">*</span></label>
                <input type="url" name="website" required value={formData.website} onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Discord Invite</label>
              <input type="url" name="discord_invite" value={formData.discord_invite} onChange={handleChange}
                placeholder="https://discord.gg/..."
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
            </div>

            {/* Voting & Callback */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-0.5">Voting & In-Game Rewards</h3>
                <p className="text-xs text-muted-foreground">Configure how players vote and how your game server is notified to grant rewards.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Vote Page URL</label>
                <input type="url" name="vote_link" value={formData.vote_link} onChange={handleChange}
                  placeholder="https://your-vote-site.com/vote"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
                <p className="text-xs text-muted-foreground mt-1">The external page players are sent to when they click "Vote Now".</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Callback URL</label>
                <input type="url" name="callback_url" value={formData.callback_url} onChange={handleChange}
                  placeholder="https://your-game-server.com/vote-callback"
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
                <p className="text-xs text-muted-foreground mt-1">
                  After a player votes, ScapePulse will POST to this URL with{" "}
                  <code className="bg-muted px-1 rounded text-xs">uid=&lt;key&gt;&amp;voter_name=&lt;player&gt;</code>.
                  Your server uses this to grant in-game rewards automatically.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Revision <span className="text-red-500">*</span></label>
                <select name="revision" required value={formData.revision} onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground">
                  <option value="">Select Revision</option>
                  {REVISION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Server Type <span className="text-red-500">*</span></label>
                <select name="server_type" required value={formData.server_type} onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground">
                  <option value="">Select Type</option>
                  {SERVER_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Experience Rate</label>
                <select name="experience_rate" value={formData.experience_rate} onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground">
                  <option value="">Select Rate</option>
                  {EXPERIENCE_RATE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Average Player Count</label>
                <select name="player_count" value={formData.player_count} onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground">
                  <option value="">Select Count</option>
                  {PLAYER_COUNT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Short Description <span className="text-red-500">*</span>
                <span className="text-muted-foreground font-normal ml-1">(shown in list view)</span>
              </label>
              <textarea name="short_description" required value={formData.short_description} onChange={handleChange} rows={2} maxLength={350}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Full Description <span className="text-red-500">*</span></label>
              <textarea name="description" required value={formData.description} onChange={handleChange} rows={8}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Server Logo/Icon</label>
                {formData.image_url && <img src={formData.image_url} alt="Preview" className="max-w-[100px] max-h-[100px] object-cover border border-border rounded mb-2" />}
                <input type="file" accept="image/*" onChange={(e) => handleImageFile(e, "image_url")}
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground" />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 64x64px</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Banner Image</label>
                {formData.banner_url && <img src={formData.banner_url} alt="Preview" className="max-w-[200px] max-h-[60px] object-cover border border-border rounded mb-2" />}
                <input type="file" accept="image/*" onChange={(e) => handleImageFile(e, "banner_url")}
                  className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground" />
                <p className="text-xs text-muted-foreground mt-1">Recommended: 728x90px</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
              <input type="text" name="tags" value={formData.tags} onChange={handleChange}
                placeholder="economy, pvp, custom, ..."
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground" />
              <p className="text-xs text-muted-foreground mt-1">Separate tags with commas</p>
            </div>

            <div className="flex justify-center pt-6 border-t border-border">
              <button type="submit" disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg">
                {loading ? "Submitting..." : "Submit Server"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <ToplistFooter />
    </div>
  )
}
