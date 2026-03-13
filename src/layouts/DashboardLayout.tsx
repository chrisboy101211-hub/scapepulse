import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/lib/auth";
import { useServers } from "@/lib/server-context";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, ChevronDown } from "lucide-react";
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card/50">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-2" />
              
              {serversLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : servers.length > 0 ? (
                <Select 
                  value={selectedServer?.id} 
                  onValueChange={(value) => {
                    const server = servers.find(s => s.id === value);
                    setSelectedServer(server || null);
                  }}
                >
                  <SelectTrigger className="w-[200px] h-8">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse-glow" />
                      <SelectValue placeholder="Select server" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {servers.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm text-muted-foreground">No Server</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {authLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet context={{ selectedServer }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
