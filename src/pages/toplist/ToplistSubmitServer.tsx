import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from "react-router-dom"
import { ToplistHeader } from "@/components/toplist/ToplistHeader"
import { ToplistFooter } from "@/components/toplist/ToplistFooter"
import { toplistDataService } from "@/lib/toplist-data"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth"
import { RichTextEditor } from "@/components/RichTextEditor"

const BUCKET = "server-banners"

async function uploadToStorage(file: File, userId: string, slot: "icon" | "banner"): Promise<string> {
  const ext = file.name.split(".").pop() ?? "png"
  const path = `${userId}/${slot}-${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
  if (error) throw new Error(error.message)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

const REVISION_OPTIONS = ["OSRS", "RS2", "RS3 (EOC)", "Custom/Modified", "Pre-EOC", "Legacy"]
const SERVER_TYPE_OPTIONS = ["Economy", "PvP", "PvM", "Skilling", "Custom", "Hardcore", "Ironman", "HCIM", "Spawn", "Hybrid", "Pure", "Max", "Completionist"]
const EXPERIENCE_RATE_OPTIONS = ["1x (Vanilla)", "2x", "5x", "10x", "25x", "50x", "100x", "200x", "500x", "1000x", "Custom"]
const PLAYER_COUNT_OPTIONS = ["0-50", "51-100", "101-250", "251-500", "501-1000", "1000+"]

// ── Reusable form row ────────────────────────────────────────────────────────
function Row({ label, required, hint, children }: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-4 py-5 border-b border-border/50 last:border-0">
      <div className="pt-2.5">
        <span className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </div>
      <div>
        {children}
        {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
      </div>
    </div>
  )
}

// ── Tag chip input ────────────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("")

  const add = (raw: string) => {
    const next = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
    if (next && !tags.includes(next) && tags.length < 8) {
      onChange([...tags, next])
    }
    setInput("")
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input) }
    if (e.key === "Backspace" && !input && tags.length) onChange(tags.slice(0, -1))
  }

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 bg-background border border-border rounded-md focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary min-h-[42px] cursor-text"
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}>
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 px-2.5 py-0.5 bg-primary/20 text-primary rounded-full text-xs font-medium border border-primary/30">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}
            className="hover:text-destructive transition-colors leading-none">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => input.trim() && add(input)}
        placeholder={tags.length === 0 ? "osrs, pvp, economy …" : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
      />
    </div>
  )
}

// ── Drag-and-drop file uploader ───────────────────────────────────────────────
function FileUpload({ label, preview, onUpload, onClear, hint }: {
  label: string
  preview: string
  onUpload: (file: File) => Promise<void>
  onClear: () => void
  hint?: string
}) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const [uploadError, setUploadError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const process = async (file: File) => {
    setUploading(true)
    setUploadError("")
    setFileName(file.name)
    setFileSize(file.size)
    try {
      await onUpload(file)
    } catch (e: any) {
      setUploadError(e?.message || "Upload failed")
      setFileName("")
      setFileSize(0)
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) process(file)
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) process(file)
  }

  const clear = () => {
    onClear(); setFileName(""); setFileSize(0); setUploadError("")
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative border-2 border-dashed rounded-lg transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
      >
        <div className="flex items-center gap-4 p-4">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex-shrink-0 px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium rounded-md transition-colors border border-border disabled:opacity-50">
            {uploading ? "Uploading…" : "Choose File"}
          </button>
          <div className="text-sm text-muted-foreground">
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Uploading to storage…</span>
              </div>
            ) : (
              <>
                <p>Or drag and drop your file here</p>
                <p className="text-xs mt-0.5">Accepted: gif, jpeg, jpg, png, webp · Max 5 MB</p>
              </>
            )}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
      </div>

      {uploadError && <p className="text-xs text-destructive mt-1.5">{uploadError}</p>}

      {preview && !uploading && (
        <div className="mt-3 flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
          <img src={preview} alt="Preview" className="w-14 h-14 object-cover rounded border border-border flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{fileName || label}</p>
            {fileSize > 0 && <p className="text-xs text-muted-foreground">{(fileSize / 1024).toFixed(1)} kB</p>}
            <p className="text-xs text-green-500 mt-0.5">✓ Uploaded</p>
          </div>
          <button type="button" onClick={clear}
            className="flex-shrink-0 w-6 h-6 rounded-full bg-muted hover:bg-destructive/20 hover:text-destructive text-muted-foreground flex items-center justify-center text-sm transition-colors">
            ×
          </button>
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ToplistSubmitServer() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [existingServer, setExistingServer] = useState(false)

  const [form, setForm] = useState({
    name: "", website: "", discord_invite: "", vote_link: "", callback_url: "",
    revision: "", server_type: "", experience_rate: "", player_count: "",
    short_description: "", description: "", image_url: "", banner_url: "",
  })
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => { if (!authLoading && !user) navigate("/login") }, [user, authLoading, navigate])
  useEffect(() => {
    if (user) toplistDataService.getUserServer(user.id).then((s) => { if (s) setExistingServer(true) })
  }, [user])

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError("")
    try {
      await toplistDataService.createServer({
        user_id: user.id,
        name: form.name,
        website: form.website,
        discord_invite: form.discord_invite || null,
        description: form.description,
        short_description: form.short_description || null,
        revision: form.revision,
        server_type: form.server_type,
        experience_rate: form.experience_rate || null,
        player_count: form.player_count || null,
        tags,
        image_url: form.image_url || null,
        banner_url: form.banner_url || null,
        features: null,
        custom_content: null,
        staff_info: null,
        rules: null,
        vote_link: form.vote_link || null,
        callback_url: form.callback_url || null,
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
        <div className="container mx-auto px-8 py-10 max-w-5xl">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-blue-300 mb-2">Server Already Submitted</h2>
            <p className="text-blue-200 text-sm mb-4">Each account can only have one server listing.</p>
            <Link to="/toplist" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
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

      <div className="container mx-auto px-8 py-10 max-w-5xl">
        <h1 className="text-3xl font-bold text-foreground mb-1">Submit Your Server</h1>
        <p className="text-muted-foreground text-sm mb-8">Get your RSPS listed on the ScapePulse Toplist</p>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">

            <Row label="Server Name" required>
              <input type="text" name="name" required value={form.name} onChange={set}
                placeholder="My Awesome RSPS"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors" />
            </Row>

            <Row label="Tags" required hint="Press Enter or comma to add. Up to 8 tags.">
              <TagInput tags={tags} onChange={setTags} />
            </Row>

            <Row label="Website URL" required hint="The URL to your server's website.">
              <input type="url" name="website" required value={form.website} onChange={set}
                placeholder="https://www.yourserver.com"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors" />
            </Row>

            <Row label="Url Callback" hint="ScapePulse POSTs uid=<key>&voter_name=<player> here after each confirmed vote so your server can grant in-game rewards automatically.">
              <input type="url" name="callback_url" value={form.callback_url} onChange={set}
                placeholder="https://yourserver.com/vote/callback.php"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors" />
            </Row>

            <Row label="Discord Invite" hint="Add your Discord invite link.">
              <input type="url" name="discord_invite" value={form.discord_invite} onChange={set}
                placeholder="https://discord.gg/yourserver"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors" />
            </Row>

            <Row label="Vote Page URL" hint="Page players are sent to when they click Vote Now.">
              <input type="url" name="vote_link" value={form.vote_link} onChange={set}
                placeholder="https://yourserver.com/vote"
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors" />
            </Row>

            <Row label="Revision" required>
              <select name="revision" required value={form.revision} onChange={set}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors">
                <option value="">Select Revision</option>
                {REVISION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Row>

            <Row label="Category" required>
              <select name="server_type" required value={form.server_type} onChange={set}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors">
                <option value="">Select Category</option>
                {SERVER_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Row>

            <Row label="Experience Rate">
              <select name="experience_rate" value={form.experience_rate} onChange={set}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors">
                <option value="">Select Rate</option>
                {EXPERIENCE_RATE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Row>

            <Row label="Player Count">
              <select name="player_count" value={form.player_count} onChange={set}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors">
                <option value="">Select Count</option>
                {PLAYER_COUNT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </Row>

            <Row label="Short Description" required hint="Shown in list and card views. Max 350 characters.">
              <textarea name="short_description" required rows={2} maxLength={350}
                value={form.short_description} onChange={set}
                placeholder="A brief summary of your server..."
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-colors resize-none" />
              <p className="text-xs text-muted-foreground text-right mt-0.5">{form.short_description.length}/350</p>
            </Row>

            <Row label="Server Description" required hint="Full server description shown on your server's detail page. Supports rich formatting, code blocks, images, and more.">
              <RichTextEditor
                value={form.description}
                onChange={(html) => setForm((p) => ({ ...p, description: html }))}
                placeholder="Tell players about your server's features, content, and community…"
                minHeight={300}
              />
            </Row>

            <Row label="Server Icon" hint="Recommended: 64×64px. Shown on your server card.">
              <FileUpload
                label="icon"
                preview={form.image_url}
                onUpload={async (file) => {
                  if (!user) throw new Error("Not logged in")
                  const url = await uploadToStorage(file, user.id, "icon")
                  setForm((p) => ({ ...p, image_url: url }))
                }}
                onClear={() => setForm((p) => ({ ...p, image_url: "" }))}
                hint="Square logo/icon for your server."
              />
            </Row>

            <Row label="Banner Upload" hint="Recommended: 728×90px. Displayed on your server's detail page.">
              <FileUpload
                label="banner"
                preview={form.banner_url}
                onUpload={async (file) => {
                  if (!user) throw new Error("Not logged in")
                  const url = await uploadToStorage(file, user.id, "banner")
                  setForm((p) => ({ ...p, banner_url: url }))
                }}
                onClear={() => setForm((p) => ({ ...p, banner_url: "" }))}
                hint="Servers with only an icon and no banner may be replaced with a placeholder."
              />
            </Row>

          </div>

          <div className="mt-6 flex items-center justify-between">
            <Link to="/toplist" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Toplist
            </Link>
            <button type="submit" disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg text-sm">
              {loading ? "Submitting…" : "Submit Server"}
            </button>
          </div>
        </form>
      </div>

      <ToplistFooter />
    </div>
  )
}
