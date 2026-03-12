import { mockServers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ApiKeys = () => {
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  const toggleVisibility = (id: string) => setVisible((prev) => ({ ...prev, [id]: !prev[id] }));

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">API Keys</h1>
        <p className="text-sm text-muted-foreground">Manage server API keys for reward delivery</p>
      </div>

      <div className="space-y-4">
        {mockServers.map((server) => (
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-3 rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Usage example:</p>
              <code className="font-mono text-xs text-primary">
                Authorization: Bearer {visible[server.id] ? server.api_key : "<your-api-key>"}
              </code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiKeys;
