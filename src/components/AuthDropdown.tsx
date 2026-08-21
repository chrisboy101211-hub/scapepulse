import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, Loader2, Globe } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { isValidUsername, normalizeUsername, signInWithUsername } from "@/lib/username-auth"

const MAIN_DOMAIN = "scapepulse.com"

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
}

type AuthView = "login" | "register"

interface AuthDropdownProps {
  defaultView?: AuthView
  trigger: React.ReactNode
}

export function AuthDropdown({ defaultView = "login", trigger }: AuthDropdownProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<AuthView>(defaultView)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const toggleMenu = () => {
    setOpen((currentlyOpen) => {
      const willOpen = !currentlyOpen
      if (willOpen) setView(defaultView)
      return willOpen
    })
  }

  return (
    <div ref={ref} className="relative z-[110]">
      {/* Keep the click handler on the trigger only. Putting it on this parent
          makes every click inside the form bubble up and close the dropdown. */}
      <div onClick={toggleMenu}>{trigger}</div>
      {open && (
        <div className="absolute right-0 top-full z-[120] mt-2 w-[380px] rounded-xl border border-border/60 bg-card p-5 shadow-2xl">
          {view === "login" ? (
            <LoginForm
              onSwitch={() => setView("register")}
              onSuccess={() => setOpen(false)}
            />
          ) : (
            <RegisterForm
              onSwitch={() => setView("login")}
              onSuccess={() => setOpen(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}

function LoginForm({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields")
      return
    }
    if (!isValidUsername(username)) {
      toast.error("Username must be 3-30 lowercase letters, numbers, or underscores")
      return
    }
    setLoading(true)
    try {
      await signInWithUsername(username, password)
      toast.success("Welcome back!")
      onSuccess()
      navigate("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="font-display text-lg font-bold mb-1">Welcome back</h3>
      <p className="text-xs text-muted-foreground mb-4">Sign in to manage your servers</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="dd-username" className="text-xs">Username</Label>
          <Input
            id="dd-username"
            autoComplete="username"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-password" className="text-xs">Password</Label>
          <Input
            id="dd-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
        <Button type="submit" variant="hero" className="w-full gap-2 h-9" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Don't have an account?{" "}
        <button onClick={onSwitch} className="text-primary hover:underline font-medium">
          Sign up
        </button>
      </p>
    </div>
  )
}

function RegisterForm({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess: () => void }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [serverName, setServerName] = useState("")
  const [loading, setLoading] = useState(false)

  const slug = generateSlug(serverName)
  const subdomain = slug ? `${slug}.${MAIN_DOMAIN}` : ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields")
      return
    }
    if (!isValidUsername(username)) {
      toast.error("Username must be 3-30 lowercase letters, numbers, or underscores")
      return
    }
    if (!serverName.trim()) {
      toast.error("Please enter your server name")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (slug.length < 3) {
      toast.error("Server name must be at least 3 characters")
      return
    }

    setLoading(true)
    try {
      const { data: existingServer } = await supabase
        .from("servers")
        .select("id")
        .eq("slug", slug)
        .maybeSingle()

      if (existingServer) {
        toast.error("This server name is already taken")
        setLoading(false)
        return
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: normalizeUsername(username) } },
      })

      if (authError) throw authError

      if (!authData.session) {
        toast.success("Account created! Verify your email, then sign in to finish setting up your server.")
        onSuccess()
        navigate("/login")
        return
      }

      if (authData.user) {
        const userId = authData.user.id
        const { error: serverError } = await supabase.from("servers").insert({
          id: `srv-${Date.now()}`,
          name: serverName,
          slug: slug,
          game_type: "rsps",
          description: `Welcome to ${serverName}`,
          subdomain: subdomain,
          api_key: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
          status: "online",
          players_online: 0,
          user_id: userId,
        })

        if (serverError) throw new Error("Failed to create server: " + serverError.message)
      }

      toast.success("Account created! Check your email to verify.")
      onSuccess()
      navigate("/login")
    } catch (error: any) {
      toast.error(error.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="font-display text-lg font-bold mb-1">Create your account</h3>
      <p className="text-xs text-muted-foreground mb-4">Start monetizing your game server</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="dd-reg-username" className="text-xs">Username</Label>
          <Input
            id="dd-reg-username"
            autoComplete="username"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-reg-email" className="text-xs">Verification email</Label>
          <Input
            id="dd-reg-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-reg-password" className="text-xs">Password</Label>
          <Input
            id="dd-reg-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-reg-confirm" className="text-xs">Confirm Password</Label>
          <Input
            id="dd-reg-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
        <div className="border-t border-border pt-3">
          <p className="text-xs text-muted-foreground mb-2">Your first server (required)</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dd-reg-server" className="text-xs">Server Name</Label>
          <Input
            id="dd-reg-server"
            placeholder="My Awesome Server"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            className="bg-background border-border h-9 text-sm"
          />
        </div>
        {serverName && (
          <div className="space-y-1.5">
            <Label className="text-xs">Your Store URL</Label>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-md text-xs">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono">{subdomain}</span>
            </div>
          </div>
        )}
        <Button type="submit" variant="hero" className="w-full gap-2 h-9" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"} <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <button onClick={onSwitch} className="text-primary hover:underline font-medium">
          Sign in
        </button>
      </p>
    </div>
  )
}
