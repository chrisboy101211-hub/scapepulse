import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { dataService } from "@/lib/data";
import type { Server } from "@/lib/mock-data";

const DashboardLayout = () => {
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [server, setServer] = useState<Server | null>(null)

  useEffect(() => {
    if (user) {
      dataService.getServers().then(servers => {
        if (servers.length > 0) setServer(servers[0])
      })
    }
  }, [user])

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
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-4" />
              <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse-glow" />
              <span className="text-sm text-muted-foreground">{server?.name || "No Server"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
