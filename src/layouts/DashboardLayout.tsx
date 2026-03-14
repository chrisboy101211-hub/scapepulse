import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import DashboardNavBar from "@/components/DashboardNavBar";
import { useAuth } from "@/lib/auth";
import { useServers } from "@/lib/server-context";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Globe, Users, Gamepad2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DashboardLayout = () => {
  const { user, signOut, loading: authLoading } = useAuth()
  const { servers, selectedServer, setSelectedServer, loading: serversLoading } = useServers()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate("/login")
  }

  const handleServerChange = (value: string) => {
    const server = servers.find(s => s.id === value);
    setSelectedServer(server || null);
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full flex-col">
        <DashboardNavBar />
        <div className="flex flex-1">
          <DashboardSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 flex items-center justify-between border-b border-border px-4 bg-card/50">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="mr-2" />
                
                {serversLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : servers.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <Select 
                      value={selectedServer?.id || ""} 
                      onValueChange={handleServerChange}
                    >
                      <SelectTrigger className="w-[220px] h-9">
                        <div className="flex items-center gap-2">
                          {selectedServer ? (
                            <>
                              <div className={`h-2 w-2 rounded-full ${selectedServer.status === "online" ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
                            </>
                          ) : null}
                          <SelectValue placeholder="Select server" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {servers.map((server) => (
                          <SelectItem key={server.id} value={server.id}>
                            <div className="flex items-center gap-2">
                              <Gamepad2 className="h-4 w-4" />
                              <span>{server.name}</span>
                              <span className="text-xs text-muted-foreground capitalize">({server.game_type})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedServer && (
                      <>
                        <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                          <Globe className="h-3.5 w-3.5" />
                          <span className="font-mono text-xs">{selectedServer.subdomain}</span>
                        </div>
                        <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>{selectedServer.players_online}</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No servers yet</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              <Outlet context={{ selectedServer }} />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
