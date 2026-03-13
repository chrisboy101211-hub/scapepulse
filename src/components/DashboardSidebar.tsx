import {
  LayoutDashboard,
  Server,
  ShoppingCart,
  FolderOpen,
  Receipt,
  Vote,
  Key,
  Settings,
  LogOut,
  Trophy,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Logo } from "@/components/Logo";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Servers", url: "/dashboard/servers", icon: Server },
];

const storeItems = [
  { title: "Products", url: "/dashboard/products", icon: ShoppingCart },
  { title: "Categories", url: "/dashboard/categories", icon: FolderOpen },
  { title: "Orders", url: "/dashboard/orders", icon: Receipt },
];

const systemItems = [
  { title: "Votes", url: "/dashboard/votes", icon: Vote },
  { title: "Hiscores", url: "/dashboard/hiscores-settings", icon: Trophy },
  { title: "API Keys", url: "/dashboard/api", icon: Key },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const renderGroup = (label: string, items: typeof mainItems) => (
    <SidebarGroup>
      <SidebarGroupLabel className="text-muted-foreground/60 text-xs uppercase tracking-wider">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/dashboard"}
                  className="hover:bg-secondary transition-colors"
                  activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className="flex h-16 items-center gap-2 px-4 border-b border-border">
          <Logo size="sm" />
          {!collapsed && (
            <span className="font-display text-lg font-bold text-foreground">
            </span>
          )}
        </div>
        {renderGroup("Main", mainItems)}
        {renderGroup("Store", storeItems)}
        {renderGroup("System", systemItems)}
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/")}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Log Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
