import { useState } from "react"
import { dataService } from "@/lib/data"
import { useServers } from "@/lib/server-context"
import { Button } from "@/components/ui/button"
import { Copy, RefreshCw, Eye, EyeOff, Loader2, Key } from "lucide-react"
import { toast } from "sonner"

const ApiKeys = () => {
  const { selectedServer } = useServers()
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  const copyKey = () => {
    if (selectedServer?.api_key) {
      navigator.clipboard.writeText(selectedServer.api_key)
      toast.success("API key copied!")
    }
  }

  const regenerateKey = async () => {
    if (!selectedServer) return
    setLoading(true)
    try {
      const newKey = `sk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 5)}`
      await dataService.updateServer(selectedServer.id, { api_key: newKey })
      toast.success("API key regenerated!")
      window.location.reload()
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate API key")
    } finally {
      setLoading(false)
    }
  }

  if (!selectedServer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-muted-foreground">Manage server API keys for reward delivery</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Key className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Server Selected</h2>
          <p className="text-muted-foreground">Select a server from the dropdown to view its API key</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">API Keys</h1>
        <p className="text-sm text-muted-foreground">API key for {selectedServer.name}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${selectedServer.status === "online" ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
            <h3 className="font-display font-semibold text-lg">{selectedServer.name}</h3>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs uppercase">{selectedServer.game_type}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Your API Key</Label>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 rounded-md bg-muted px-3 py-2.5 font-mono text-sm">
                {visible ? selectedServer.api_key : "••••••••••••••••••••••••••••••"}
              </div>
              <Button variant="outline" size="icon" onClick={() => setVisible(!visible)}>
                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={copyKey}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={regenerateKey} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/50">
          <h4 className="font-medium mb-2">Java Integration</h4>
          <pre className="text-xs font-mono overflow-x-auto">
{`// Use this key directly in your Java code
private static final String SECRET_KEY = "${selectedServer.api_key}";`}
          </pre>
        </div>
      </div>

    </div>
  );
};

import { Label } from "@/components/ui/label"

export default ApiKeys;
