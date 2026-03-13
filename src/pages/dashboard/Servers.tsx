import { useEffect, useState } from "react"
import { dataService } from "@/lib/data"
import { useAuth } from "@/lib/auth"
import { useServers } from "@/lib/server-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, ExternalLink, Globe, Users, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import type { Server } from "@/lib/mock-data"

const MAIN_DOMAIN = "scapepulse.com"

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

const Servers = () => {
  const { user } = useAuth()
  const { setSelectedServer } = useServers()
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    game_type: "rsps" as "rsps" | "minecraft",
    description: "",
  })
  const navigate = useNavigate()

  const slug = generateSlug(formData.name)
  const subdomain = slug ? `${slug}.${MAIN_DOMAIN}` : ""

  useEffect(() => {
    loadServers()
  }, [user])

  const loadServers = async () => {
    try {
      const data = await dataService.getServers(user?.id)
      setServers(data)
    } catch (error) {
      console.error("Failed to load servers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) {
      toast.error("Please enter a server name")
      return
    }
    if (slug.length < 3) {
      toast.error("Server name must be at least 3 characters")
      return
    }
    if (!user) {
      toast.error("You must be logged in")
      return
    }
    setSubmitting(true)
    try {
      await dataService.createServer({
        name: formData.name,
        slug: slug,
        game_type: formData.game_type,
        description: formData.description,
        subdomain: subdomain,
        api_key: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
        status: "offline",
        players_online: 0,
        user_id: user.id,
      })
      toast.success("Server created!")
      setDialogOpen(false)
      setFormData({ name: "", game_type: "rsps", description: "" })
      loadServers()
    } catch (error: any) {
      toast.error(error.message || "Failed to create server")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Servers</h1>
          <p className="text-sm text-muted-foreground">Manage your game servers</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Server
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Server</DialogTitle>
              <DialogDescription>
                Create a new game server store
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Server Name *</Label>
                <Input
                  id="name"
                  placeholder="My Awesome Server"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              {formData.name && (
                <div className="space-y-2">
                  <Label>Your Store URL (auto-generated)</Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-md text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{subdomain || "..."}</span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Game Type</Label>
                <Select value={formData.game_type} onValueChange={(v: "rsps" | "minecraft") => setFormData({ ...formData, game_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rsps">RSPS (RuneScape Private Server)</SelectItem>
                    <SelectItem value="minecraft">Minecraft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="A brief description of your server"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="hero" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Server
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No servers found. Add your first server to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {servers.map((server) => (
            <div key={server.id} className="rounded-lg border border-border bg-card p-6 transition-all hover:border-primary/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold">{server.name}</h3>
                    <span className={`inline-flex h-2 w-2 rounded-full ${server.status === "online" ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{server.description}</p>
                </div>
                <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium uppercase text-secondary-foreground">
                  {server.game_type}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  <span className="font-mono text-xs">{server.subdomain}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{server.players_online} online</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/store/${server.slug}`)}>
                  <ExternalLink className="h-3.5 w-3.5" /> View Store
                </Button>
                <Button variant="hero" size="sm" onClick={() => {
                  setSelectedServer(server)
                  navigate("/dashboard/products")
                }}>Manage</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Servers;
