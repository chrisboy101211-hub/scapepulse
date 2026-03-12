import { mockServers } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Globe, Users } from "lucide-react";

const Servers = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Servers</h1>
          <p className="text-sm text-muted-foreground">Manage your game servers</p>
        </div>
        <Button variant="hero" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Server
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockServers.map((server) => (
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
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" /> View Store
              </Button>
              <Button variant="ghost" size="sm">Manage</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Servers;
