import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { profileService, BORDER_EFFECTS, type Profile, type BorderEffect } from "@/lib/profile-data"
import { AvatarBorder } from "@/components/AvatarBorder"
import { User, Crown } from "lucide-react"

const inputCls = "w-full px-3 py-2 bg-secondary/40 border border-border/60 rounded text-foreground text-sm focus:outline-none focus:border-primary/70 focus:ring-1 focus:ring-primary/20 transition-colors placeholder:text-muted-foreground/50"

export default function ProfileSettings() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    display_name: "",
    username: "",
    bio: "",
    avatar_url: "",
    banner_url: "",
    border_effect: "none" as BorderEffect | string,
    profile_color: "#00ffff",
  })

  useEffect(() => {
    if (!user) return
    profileService.getById(user.id).then(p => {
      if (p) {
        setProfile(p)
        setForm({
          display_name: p.display_name ?? "",
          username: p.username ?? "",
          bio: p.bio ?? "",
          avatar_url: p.avatar_url ?? "",
          banner_url: p.banner_url ?? "",
          border_effect: p.border_effect ?? "none",
          profile_color: p.profile_color ?? "#00ffff",
        })
      }
      setLoading(false)
    })
  }, [user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true); setError(""); setSaved(false)
    try {
      await profileService.upsert({
        id: user.id,
        display_name: form.display_name || null,
        username: form.username || null,
        bio: form.bio || null,
        avatar_url: form.avatar_url || null,
        banner_url: form.banner_url || null,
        border_effect: form.border_effect,
        profile_color: form.profile_color,
      } as any)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!user) return
    setUploadingAvatar(true)
    try {
      const url = await profileService.uploadProfileAsset(file, user.id, 'avatar')
      setForm(p => ({ ...p, avatar_url: url }))
    } finally { setUploadingAvatar(false) }
  }

  const uploadBanner = async (file: File) => {
    if (!user) return
    setUploadingBanner(true)
    try {
      const url = await profileService.uploadProfileAsset(file, user.id, 'banner')
      setForm(p => ({ ...p, banner_url: url }))
    } finally { setUploadingBanner(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const isPremium = profile?.is_premium ?? false

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <User className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your public profile page</p>
        </div>
        {form.username && (
          <a href={`/u/${form.username}`} target="_blank" rel="noopener noreferrer"
            className="ml-auto text-xs text-primary hover:underline">
            View Profile →
          </a>
        )}
      </div>

      {error && <div className="mb-4 bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded text-sm">{error}</div>}
      {saved && <div className="mb-4 bg-green-900/20 border border-green-500/30 text-green-300 px-4 py-3 rounded text-sm">✓ Profile saved.</div>}

      {/* Live preview */}
      <div className="border border-border/40 rounded-xl p-4 bg-card/50 mb-6">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider font-semibold">Preview</p>
        <div className="relative h-24 rounded-lg overflow-hidden mb-3"
          style={{ background: form.banner_url ? undefined : `linear-gradient(135deg, ${form.profile_color}22, #0f0f1a, ${form.profile_color}11)` }}>
          {form.banner_url && <img src={form.banner_url} className="w-full h-full object-cover" alt="banner" />}
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          <div className="absolute bottom-2 left-3">
            <AvatarBorder
              avatarUrl={form.avatar_url || null}
              displayName={form.display_name || "?"}
              borderEffect={form.border_effect as BorderEffect}
              profileColor={form.profile_color}
              size={48}
            />
          </div>
        </div>
        <p className="text-sm font-bold text-foreground">{form.display_name || "Your Name"}</p>
        <p className="text-xs text-muted-foreground">@{form.username || "username"}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Display name + username */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Display Name</label>
            <input type="text" value={form.display_name} maxLength={50}
              onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))}
              placeholder="Your display name" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Username <span className="text-muted-foreground font-normal">(URL: /u/username)</span></label>
            <input type="text" value={form.username} maxLength={30}
              onChange={e => setForm(p => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
              placeholder="username" className={inputCls} />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Bio</label>
          <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            maxLength={300} rows={3} placeholder="Tell the community about yourself…"
            className={`${inputCls} resize-none`} />
          <p className="text-xs text-muted-foreground/60 text-right mt-0.5">{form.bio.length}/300</p>
        </div>

        {/* Avatar */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Profile Picture</label>
          <div className="flex items-center gap-4">
            <AvatarBorder avatarUrl={form.avatar_url || null} displayName={form.display_name || "?"}
              borderEffect={form.border_effect as BorderEffect} profileColor={form.profile_color} size={56} />
            <div className="flex-1">
              <button type="button" onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border/60 rounded text-sm text-foreground font-medium transition-colors disabled:opacity-50">
                {uploadingAvatar ? "Uploading…" : "Upload Photo"}
              </button>
              {form.avatar_url && (
                <button type="button" onClick={() => setForm(p => ({ ...p, avatar_url: "" }))}
                  className="ml-2 text-xs text-muted-foreground hover:text-destructive transition-colors">Remove</button>
              )}
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, GIF, WebP · Max 5 MB</p>
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
        </div>

        {/* Banner */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Profile Banner</label>
          {form.banner_url ? (
            <div className="relative h-20 rounded-lg overflow-hidden mb-2 border border-border/40">
              <img src={form.banner_url} className="w-full h-full object-cover" alt="banner" />
              <button type="button" onClick={() => setForm(p => ({ ...p, banner_url: "" }))}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full text-white hover:bg-destructive/80 transition-colors text-sm flex items-center justify-center">×</button>
            </div>
          ) : null}
          <button type="button" onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border/60 rounded text-sm text-foreground font-medium transition-colors disabled:opacity-50">
            {uploadingBanner ? "Uploading…" : form.banner_url ? "Change Banner" : "Upload Banner"}
          </button>
          <p className="text-xs text-muted-foreground mt-1">Recommended: 1200×300px</p>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadBanner(f) }} />
        </div>

        {/* Profile color */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Accent Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={form.profile_color}
              onChange={e => setForm(p => ({ ...p, profile_color: e.target.value }))}
              className="w-10 h-10 rounded cursor-pointer border border-border/60 bg-transparent p-0.5" />
            <span className="text-sm text-muted-foreground font-mono">{form.profile_color}</span>
          </div>
        </div>

        {/* Border effect picker */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Avatar Border Effect
            {!isPremium && <span className="ml-2 text-xs text-muted-foreground font-normal">— Premium effects require 20+ toplist votes</span>}
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {BORDER_EFFECTS.map(eff => {
              const locked = eff.premium && !isPremium
              const active = form.border_effect === eff.id
              return (
                <button
                  key={eff.id}
                  type="button"
                  disabled={locked}
                  onClick={() => !locked && setForm(p => ({ ...p, border_effect: eff.id }))}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all
                    ${active ? "border-primary bg-primary/10" : "border-border/40 hover:border-border/70 bg-card/30"}
                    ${locked ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <AvatarBorder avatarUrl={null} displayName="A"
                    borderEffect={eff.id as BorderEffect} profileColor={form.profile_color} size={36} />
                  <span className="text-xs text-foreground font-medium leading-none">{eff.label}</span>
                  {eff.premium && (
                    <Crown className="w-2.5 h-2.5 text-yellow-500 absolute top-1.5 right-1.5" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="pt-2">
          <button type="submit" disabled={saving}
            className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-semibold disabled:opacity-50 transition-colors text-sm">
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  )
}
