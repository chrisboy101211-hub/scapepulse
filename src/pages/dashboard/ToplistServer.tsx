import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"
import { uploadToplistImage } from "@/lib/toplist-storage"
import { useAuth } from "@/lib/auth"
import { RichTextEditor } from "@/components/RichTextEditor"
import { ExternalLink, Trophy } from "lucide-react"

const REVISION_OPTIONS = ["OSRS", "RS2", "RS3 (EOC)", "Custom/Modified", "Pre-EOC", "Legacy"]
const SERVER_TYPE_OPTIONS = ["Economy", "PvP", "PvM", "Skilling", "Custom", "Hardcore", "Ironman", "HCIM", "Spawn", "Hybrid", "Pure", "Max", "Completionist"]
const EXPERIENCE_RATE_OPTIONS = ["1x (Vanilla)", "2x", "5x", "10x", "25x", "50x", "100x", "200x", "500x", "1000x", "Custom"]
const PLAYER_COUNT_OPTIONS = ["0-50", "51-100", "101-250", "251-500", "501-1000", "1000+"]

const inputCls = "px-3 py-2 bg-secondary/40 border border-border/60 rounded text-foreground text-sm focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/50"

function Row({ label, required, hint, children }: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[190px_1fr] border-b border-border/30 last:border-0">
      <div className="flex items-start justify-end pr-5 pt-3 pb-3">
        <span className="text-sm font-semibold text-foreground text-right leading-tight">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </div>
      <div className="py-3 pr-4">
        {children}
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
    </div>
  )
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("")

  const add = (raw: string) => {
    const next = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "")
    if (next && !tags.includes(next) && tags.length < 8) onChange([...tags, next])
    setInput("")
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input) }
    if (e.key === "Backspace" && !input && tags.length) onChange(tags.slice(0, -1))
  }

  return (
    <div
      className="flex flex-wrap gap-1.5 px-3 py-2 bg-secondary/40 border border-border/60 rounded min-h-[38px] cursor-text focus-within:border-primary/70 focus-within:ring-1 focus-within:ring-primary/20 transition-colors"
      onClick={(e) => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
    >
      {tags.map((t) => (
        <span key={t} className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 text-primary rounded text-xs font-medium border border-primary/30">
          {t}
          <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))}
            className="hover:text-destructive transition-colors leading-none text-base">×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => input.trim() && add(input)}
        placeholder={tags.length === 0 ? "osrs, pvp, economy …" : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground/50"
      />
    </div>
  )
}

function FileUpload({ label, preview, onUpload, onClear }: {
  label: string
  preview: string
  onUpload: (file: File) => Promise<void>
  onClear: () => void
}) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState(0)
  const [uploadError, setUploadError] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const process = async (file: File) => {
    setUploading(true); setUploadError(""); setFileName(file.name); setFileSize(file.size)
    try { await onUpload(file) }
    catch (e: any) { setUploadError(e?.message || "Upload failed"); setFileName(""); setFileSize(0) }
    finally { setUploading(false) }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]; if (file) process(file)
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
        className={`relative border-2 border-dashed rounded transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/40"}`}
      >
        <div className="flex items-center gap-4 p-3">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex-shrink-0 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium rounded border border-border/60 disabled:opacity-50 transition-colors">
            {uploading ? "Uploading…" : "Choose File"}
          </button>
          <div className="text-xs text-muted-foreground">
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Uploading…</span>
              </div>
            ) : (
              <span>Or drag and drop · gif, jpeg, jpg, png, webp · Max 5 MB</span>
            )}
          </div>
        </div>
        <input ref={inputRef} type="file" accept="image/*"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) process(f) }}
          className="hidden" />
      </div>
      {uploadError && <p className="text-xs text-destructive mt-1">{uploadError}</p>}
      {preview && !uploading && (
        <div className="mt-2 flex items-center gap-3 p-2.5 bg-secondary/30 border border-border/40 rounded">
          <img src={preview} alt="Preview" className="w-12 h-12 object-cover rounded border border-border/40 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{fileName || label}</p>
            {fileSize > 0 && <p className="text-xs text-muted-foreground">{(fileSize / 1024).toFixed(1)} kB</p>}
            <p className="text-xs text-green-500 mt-0.5">✓ Uploaded</p>
          </div>
          <button type="button" onClick={clear}
            className="flex-shrink-0 w-5 h-5 rounded-full bg-muted hover:bg-destructive/20 hover:text-destructive text-muted-foreground flex items-center justify-center text-sm transition-colors">
            ×
          </button>
        </div>
      )}
    </div>
  )
}

export default function DashboardToplistServer() {
  const { user } = useAuth()
  const [server, setServer] = useState<ToplistServer | null>(null)
  const [loadingServer, setLoadingServer] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    name: "", website: "", discord_invite: "", vote_link: "", callback_url: "",
    revision: "", server_type: "", experience_rate: "", player_count: "",
    short_description: "", description: "", image_url: "", banner_url: "",
  })
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (!user) return
    toplistDataService.getUserServer(user.id).then((s) => {
      if (s) {
        setServer(s)
        setForm({
          name: s.name ?? "",
          website: s.website ?? "",
          discord_invite: s.discord_invite ?? "",
          vote_link: s.vote_link ?? "",
          callback_url: s.callback_url ?? "",
          revision: s.revision ?? "",
          server_type: s.server_type ?? "",
          experience_rate: s.experience_rate ?? "",
          player_count: s.player_count ?? "",
          short_description: s.short_description ?? "",
          description: s.description ?? "",
          image_url: s.image_url ?? "",
          banner_url: s.banner_url ?? "",
        })
        const rawTags = s.tags
        setTags(Array.isArray(rawTags) ? rawTags : (typeof rawTags === "string" ? rawTags.split(",").map((t: string) => t.trim()).filter(Boolean) : []))
      }
      setLoadingServer(false)
    })
  }, [user])

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!server) return
    setSaving(true); setError(""); setSaved(false)
    try {
      await toplistDataService.updateServer(server.id, {
        name: form.name,
        website: form.website,
        discord_invite: form.discord_invite || null,
        vote_link: form.vote_link || null,
        callback_url: form.callback_url || null,
        revision: form.revision,
        server_type: form.server_type,
        experience_rate: form.experience_rate || null,
        player_count: form.player_count || null,
        short_description: form.short_description || null,
        description: form.description,
        image_url: form.image_url || null,
        banner_url: form.banner_url || null,
        tags,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err?.message || "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  if (loadingServer) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!server) {
    return (
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Toplist Listing</h1>
        </div>
        <div className="border border-border/40 rounded-lg p-6 text-center">
          <p className="text-muted-foreground text-sm mb-4">You haven't submitted a server to the toplist yet.</p>
          <Link
            to="/toplist/submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm font-medium transition-colors"
          >
            Submit Your Server
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Toplist Listing</h1>
            <p className="text-sm text-muted-foreground">Edit your server's public listing</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total Votes</p>
            <p className="text-lg font-bold text-primary">{server.votes.toLocaleString()}</p>
          </div>
          <Link
            to={`/toplist/servers/${server.id}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border/60 rounded text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Listing
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-5 bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded text-sm">{error}</div>
      )}
      {saved && (
        <div className="mb-5 bg-green-900/20 border border-green-500/30 text-green-300 px-4 py-3 rounded text-sm">
          ✓ Changes saved successfully.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="border border-border/40 rounded-lg overflow-hidden">

          <Row label="Server Name" required>
            <input type="text" name="name" required value={form.name} onChange={set}
              placeholder="My Awesome RSPS"
              className={`w-full max-w-sm ${inputCls}`} />
          </Row>

          <Row label="Tags" required hint="Press Enter or comma to add. Up to 8 tags.">
            <TagInput tags={tags} onChange={setTags} />
          </Row>

          <Row label="Website URL" required hint="The URL to your server's website.">
            <input type="url" name="website" required value={form.website} onChange={set}
              placeholder="https://www.yourserver.com"
              className={`w-full max-w-sm ${inputCls}`} />
          </Row>

          <Row label="Url Callback" hint="ScapePulse POSTs uid=<key>&voter_name=<player> here after each confirmed vote.">
            <input type="url" name="callback_url" value={form.callback_url} onChange={set}
              placeholder="https://yourserver.com/vote/callback.php"
              className={`w-full max-w-sm ${inputCls}`} />
          </Row>

          <Row label="Discord Invite" hint="Add your Discord invite link.">
            <input type="url" name="discord_invite" value={form.discord_invite} onChange={set}
              placeholder="https://discord.gg/yourserver"
              className={`w-full max-w-sm ${inputCls}`} />
          </Row>

          <Row label="Vote Page URL" hint="Page players are sent to when they click Vote Now.">
            <input type="url" name="vote_link" value={form.vote_link} onChange={set}
              placeholder="https://yourserver.com/vote"
              className={`w-full max-w-sm ${inputCls}`} />
          </Row>

          <Row label="Revision" required>
            <select name="revision" required value={form.revision} onChange={set} className={inputCls}>
              <option value="">Select Revision</option>
              {REVISION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Row>

          <Row label="Category" required>
            <select name="server_type" required value={form.server_type} onChange={set} className={inputCls}>
              <option value="">Select Category</option>
              {SERVER_TYPE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Row>

          <Row label="Experience Rate">
            <select name="experience_rate" value={form.experience_rate} onChange={set} className={inputCls}>
              <option value="">Select Rate</option>
              {EXPERIENCE_RATE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Row>

          <Row label="Player Count">
            <select name="player_count" value={form.player_count} onChange={set} className={inputCls}>
              <option value="">Select Count</option>
              {PLAYER_COUNT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Row>

          <Row label="Short Description" required hint="Shown in list and card views. Max 350 characters.">
            <textarea name="short_description" required rows={3} maxLength={350}
              value={form.short_description} onChange={set}
              placeholder="A brief summary of your server..."
              className={`w-full resize-none ${inputCls}`} />
            <p className="text-xs text-muted-foreground/60 text-right mt-0.5">{form.short_description.length}/350</p>
          </Row>

          <Row label="Server Description" required hint="Supports rich formatting, code blocks, images, and more.">
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
                const url = await uploadToplistImage(file, user.id, "icon")
                setForm((p) => ({ ...p, image_url: url }))
              }}
              onClear={() => setForm((p) => ({ ...p, image_url: "" }))}
            />
          </Row>

          <Row label="Banner Upload" hint="Recommended: 728×90px. Displayed on your server's detail page.">
            <FileUpload
              label="banner"
              preview={form.banner_url}
              onUpload={async (file) => {
                if (!user) throw new Error("Not logged in")
                const url = await uploadToplistImage(file, user.id, "banner")
                setForm((p) => ({ ...p, banner_url: url }))
              }}
              onClear={() => setForm((p) => ({ ...p, banner_url: "" }))}
            />
          </Row>

        </div>

        <div className="mt-5 flex justify-end">
          <button type="submit" disabled={saving}
            className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-semibold disabled:opacity-50 transition-colors text-sm">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  )
}
