import { useState } from "react";
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
  ChevronDown,
  ChevronRight,
  CreditCard,
  ArrowLeftRight,
  Users,
  Tag,
  Crown,
  BarChart3,
  ThumbsUp,
  Clapperboard,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

const mainItems = [
  { title: "Overview", url: "/dashboard", icon: LayoutDashboard },
  { title: "Servers", url: "/dashboard/servers", icon: Server },
];

const webstoreItems = [
  { title: "Products", url: "/dashboard/products", icon: ShoppingCart },
  { title: "Categories", url: "/dashboard/categories", icon: FolderOpen },
  { title: "Discounts", url: "/dashboard/discounts", icon: Tag, comingSoon: true },
  { title: "Loyalty Points", url: "/dashboard/loyalty", icon: Crown, comingSoon: true },
  { title: "Transactions", url: "/dashboard/transactions", icon: ArrowLeftRight },
  { title: "Payment Methods", url: "/dashboard/payment-methods", icon: CreditCard, comingSoon: true },
  { title: "Customers", url: "/dashboard/customers", icon: Users, comingSoon: true },
  { title: "Orders", url: "/dashboard/orders", icon: Receipt },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const voteItems = [
  { title: "Votes", url: "/dashboard/votes", icon: Vote },
  { title: "Settings", url: "/dashboard/vote-settings", icon: Settings, comingSoon: true },
];

const hiscoresItems = [
  { title: "Manage Hiscores", url: "/dashboard/hiscores-settings", icon: BarChart3 },
  { title: "Settings", url: "/dashboard/hiscores-settings", icon: Settings },
];

const toplistItems = [
  { title: "My Listing", url: "/dashboard/toplist", icon: Trophy },
];

const videoHubItems = [
  { title: "Analytics", url: "/dashboard/video-hub", icon: BarChart3 },
];

const systemItems = [
  { title: "API Keys", url: "/dashboard/api", icon: Key },
];

interface CollapsibleSectionProps {
  label: string;
  icon: React.ElementType;
  items: Array<{ title: string; url: string; icon: React.ElementType; comingSoon?: boolean }>;
  collapsed: boolean;
  defaultOpen?: boolean;
}

function CollapsibleSection({ label, icon: Icon, items, collapsed, defaultOpen = false }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const location = useLocation();
  const isAnyActive = items.some((item) => location.pathname === item.url && !item.comingSoon);

  return (
    <SidebarGroup className="p-0">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={`w-full flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-none cursor-pointer transition-colors hover:bg-secondary ${
              isAnyActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">{label}</span>
                {open ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                )}
              </>
            )}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {!collapsed && (
          <CollapsibleContent>
            <SidebarMenuSub className="mx-0 border-l border-border/40 ml-6 pl-0">
              {items.map((item) => {
                const isActive = location.pathname === item.url && !item.comingSoon;
                return (
                  <SidebarMenuSubItem key={item.title + item.url}>
                    <SidebarMenuSubButton asChild>
                      {item.comingSoon ? (
                        <span className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground/50 cursor-not-allowed select-none">
                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{item.title}</span>
                          <span className="ml-auto text-[10px] bg-muted text-muted-foreground rounded px-1">Soon</span>
                        </span>
                      ) : (
                        <NavLink
                          to={item.url}
                          end={item.url === "/dashboard"}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded transition-colors"
                          activeClassName="text-primary font-medium bg-primary/5"
                        >
                          <item.icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{item.title}</span>
                        </NavLink>
                      )}
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                );
              })}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </Collapsible>
    </SidebarGroup>
  );
}

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className="flex h-16 items-center gap-2 px-4 border-b border-border">
          <Logo size="sm" />
          {!collapsed && (
            <span className="font-display text-lg font-bold text-foreground" />
          )}
        </div>

        {/* MAIN */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-xs uppercase tracking-wider">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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

        {/* SERVICES label */}
        {!collapsed && (
          <div className="px-4 pt-3 pb-1">
            <span className="text-muted-foreground/60 text-xs uppercase tracking-wider font-medium">
              Services
            </span>
          </div>
        )}

        {/* AUTO WEBSTORE */}
        <CollapsibleSection
          label="Auto Webstore"
          icon={ShoppingCart}
          items={webstoreItems}
          collapsed={collapsed}
          defaultOpen={webstoreItems.some((i) => location.pathname === i.url)}
        />

        {/* AUTO VOTE */}
        <CollapsibleSection
          label="Auto Vote"
          icon={ThumbsUp}
          items={voteItems}
          collapsed={collapsed}
          defaultOpen={voteItems.some((i) => location.pathname === i.url)}
        />

        {/* AUTO HISCORES */}
        <CollapsibleSection
          label="Auto Hiscores"
          icon={Trophy}
          items={hiscoresItems}
          collapsed={collapsed}
          defaultOpen={hiscoresItems.some((i) => location.pathname === i.url)}
        />

        {/* TOPLIST */}
        <CollapsibleSection
          label="Toplist"
          icon={BarChart3}
          items={toplistItems}
          collapsed={collapsed}
          defaultOpen={toplistItems.some((i) => location.pathname === i.url)}
        />

        {/* VIDEO HUB */}
        <CollapsibleSection
          label="Video Hub"
          icon={Clapperboard}
          items={videoHubItems}
          collapsed={collapsed}
          defaultOpen={videoHubItems.some((i) => location.pathname === i.url)}
        />

        {/* SYSTEM */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 text-xs uppercase tracking-wider">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
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
