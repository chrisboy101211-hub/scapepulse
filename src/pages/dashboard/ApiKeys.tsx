import { useEffect, useState } from "react"
import { dataService } from "@/lib/data"
import { useServers } from "@/lib/server-context"
import { Button } from "@/components/ui/button"
import { Copy, RefreshCw, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { Server } from "@/lib/mock-data"

const ApiKeys = () => {
  const { servers } = useServers()
  const [visible, setVisible] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  const toggleVisibility = (id: string) => setVisible((prev) => ({ ...prev, [id]: !prev[id] }))

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success("API key copied to clipboard")
  }

  const regenerateKey = async (server: Server) => {
    setLoading(true)
    try {
      const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 5)}`
      await dataService.updateServer(server.id, { api_key: newKey })
      toast.success("API key regenerated")
      window.location.reload()
    } catch (error) {
      toast.error("Failed to regenerate API key")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">API Keys</h1>
        <p className="text-sm text-muted-foreground">Manage server API keys for reward delivery</p>
      </div>

      {servers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No servers found. Create a server first to get API keys.
        </div>
      ) : (
        <div className="space-y-4">
          {servers.map((server) => (
            <div key={server.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold">{server.name}</h3>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs uppercase">{server.game_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-xs">
                  {visible[server.id] ? server.api_key : "••••••••••••••••••••"}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleVisibility(server.id)}>
                  {visible[server.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyKey(server.api_key)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => regenerateKey(server)} disabled={loading}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="mt-3 rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1">Base64 encoded (use in requests):</p>
                <code className="font-mono text-xs text-primary">
                  {visible[server.id] ? btoa(server.api_key) : "Base64-encoded API key"}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiKeys;
