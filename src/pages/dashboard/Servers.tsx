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
import { Card, CardContent } from "@/components/ui/card"
import { Plus, ExternalLink, Globe, Users, Loader2, Eye, EyeOff, RefreshCw, Gamepad2, Trash2 } from "lucide-react"
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
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
  const [regenerating, setRegenerating] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
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
        game_type: "rsps",
        description: formData.description,
        subdomain: subdomain,
        api_key: `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 5)}`,
        status: "offline",
        players_online: 0,
        user_id: user.id,
      })
      toast.success("Server created!")
      setDialogOpen(false)
      setFormData({ name: "", description: "" })
      loadServers()
    } catch (error: any) {
      toast.error(error.message || "Failed to create server")
    } finally {
      setSubmitting(false)
    }
  }

  const toggleKeyVisibility = (serverId: string) => {
    setVisibleKeys(prev => ({ ...prev, [serverId]: !prev[serverId] }))
  }

  const regenerateApiKey = async (server: Server) => {
    setRegenerating(server.id)
    try {
      const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 5)}`
      await dataService.updateServer(server.id, { api_key: newKey })
      toast.success("API key regenerated!")
      loadServers()
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate API key")
    } finally {
      setRegenerating(null)
    }
  }

  const toggleServerStatus = async (server: Server) => {
    try {
      const newStatus = server.status === "online" ? "offline" : "online"
      await dataService.updateServer(server.id, { status: newStatus })
      loadServers()
    } catch (error: any) {
      toast.error(error.message || "Failed to update server status")
    }
  }

  const deleteServer = async (server: Server) => {
    if (!confirm(`Are you sure you want to delete "${server.name}"? This action cannot be undone.`)) {
      return
    }
    try {
      await dataService.deleteServer(server.id)
      toast.success("Server deleted")
      loadServers()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete server")
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
              <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                Platform: <span className="font-medium text-foreground">RuneScape Private Server</span>
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
        <div className="space-y-4">
          {servers.map((server) => (
            <Card key={server.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="flex-1 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${server.status === "online" ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
                        <h3 className="font-display text-lg font-semibold">{server.name}</h3>
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs uppercase text-secondary-foreground flex items-center gap-1">
                          <Gamepad2 className="h-3 w-3" />
                          RuneScape
                        </span>
                      </div>
                      <Button 
                        variant={server.status === "online" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => toggleServerStatus(server)}
                      >
                        {server.status === "online" ? "Online" : "Offline"}
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">{server.description}</p>
                    
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Store URL</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-secondary rounded-md text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            <span className="font-mono text-xs">{server.subdomain}</span>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/store/${server.slug}`)}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">API Key</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-secondary rounded-md text-sm">
                            <span className="font-mono text-xs truncate flex-1">
                              {visibleKeys[server.id] ? server.api_key : "••••••••••••••••••••••••••••••"}
                            </span>
                          </div>
                          <Button variant="outline" size="icon" onClick={() => toggleKeyVisibility(server.id)}>
                            {visibleKeys[server.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => regenerateApiKey(server)}
                            disabled={regenerating === server.id}
                          >
                            {regenerating === server.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-32 border-l border-border flex flex-col items-center justify-center gap-3 bg-muted/30 p-4">
                    <div className="text-center">
                      <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-2xl font-bold">{server.players_online}</span>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <Button variant="hero" size="sm" className="w-full" onClick={() => {
                        setSelectedServer(server)
                        navigate("/dashboard/products")
                      }}>
                        Manage
                      </Button>
                      <Button variant="destructive" size="sm" className="w-full" onClick={() => deleteServer(server)}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Servers;
