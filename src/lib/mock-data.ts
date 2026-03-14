export interface Server {
  id: string;
  user_id?: string;
  name: string;
  slug: string;
  game_type: "rsps" | "minecraft";
  description: string;
  subdomain: string;
  api_key: string;
  created_at: string;
  status: "online" | "offline";
  players_online: number;
  hiscores_enabled?: boolean;
}

export interface Category {
  id: string;
  server_id: string;
  numeric_id?: number;
  name: string;
  description: string;
  display_order: number;
  enabled: boolean;
}

export interface Product {
  id: string;
  server_id: string;
  category_id: string;
  numeric_id?: number;
  name: string;
  item_id: number | null;
  description: string;
  price: number;
  commands: string[];
  enabled: boolean;
  image: string;
  currency: string;
}

export interface Order {
  id: string;
  server_id: string;
  username: string;
  status: "pending" | "paid" | "delivered" | "failed";
  total: number;
  created_at?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

export interface Vote {
  id: string;
  server_id: string;
  username: string;
  vote_site: string;
  timestamp: string;
}

export interface PendingTransaction {
  id: string;
  server_id: string;
  username: string;
  cart_items: Array<{ product_id: string; product_name: string; quantity: number; price: number }>;
  total: number;
  transaction_id: string;
  status: "pending" | "paid" | "failed" | "claimed";
  claimed: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  total_orders: number;
  total_votes: number;
  active_products: number;
  revenue_change: number;
  orders_change: number;
}

export const mockServers: Server[] = [
  {
    id: "srv-1",
    name: "OblivionPK",
    slug: "oblivionpk",
    game_type: "rsps",
    description: "The #1 RSPS with custom content",
    subdomain: "oblivionpk.gamestore.gg",
    api_key: "sk_live_abc123def456",
    created_at: "2024-01-15",
    status: "online",
    players_online: 247,
  },
  {
    id: "srv-2",
    name: "CraftWorld",
    slug: "craftworld",
    game_type: "minecraft",
    description: "Survival & Creative Minecraft server",
    subdomain: "craftworld.gamestore.gg",
    api_key: "sk_live_xyz789ghi012",
    created_at: "2024-03-22",
    status: "online",
    players_online: 89,
  },
];

export const mockCategories: Category[] = [
  { id: "cat-1", server_id: "srv-1", name: "Ranks", description: "Donator ranks & perks", display_order: 1, enabled: true },
  { id: "cat-2", server_id: "srv-1", name: "Items", description: "In-game items & gear", display_order: 2, enabled: true },
  { id: "cat-3", server_id: "srv-1", name: "Keys", description: "Mystery box keys", display_order: 3, enabled: true },
  { id: "cat-4", server_id: "srv-1", name: "Bundles", description: "Value bundles & packages", display_order: 4, enabled: true },
];

export const mockProducts: Product[] = [
  { id: "prod-1", server_id: "srv-1", category_id: "cat-1", name: "VIP Rank", item_id: null, description: "Access to VIP zone, custom title, and exclusive perks", price: 9.99, commands: ["add_rank {username} VIP"], enabled: true, image: "🎖️", currency: "USD" },
  { id: "prod-2", server_id: "srv-1", category_id: "cat-1", name: "MVP Rank", item_id: null, description: "All VIP perks plus priority queue and bonus XP", price: 24.99, commands: ["add_rank {username} MVP"], enabled: true, image: "⭐", currency: "USD" },
  { id: "prod-3", server_id: "srv-1", category_id: "cat-1", name: "Legend Rank", item_id: null, description: "Ultimate rank with all perks and exclusive cosmetics", price: 49.99, commands: ["add_rank {username} Legend"], enabled: true, image: "👑", currency: "USD" },
  { id: "prod-4", server_id: "srv-1", category_id: "cat-2", name: "1M Gold", item_id: 995, description: "1,000,000 gold coins delivered instantly", price: 4.99, commands: ["add_item {username} 995 1000000"], enabled: true, image: "💰", currency: "USD" },
  { id: "prod-5", server_id: "srv-1", category_id: "cat-2", name: "Armadyl Godsword", item_id: 11802, description: "The powerful AGS weapon", price: 14.99, commands: ["add_item {username} 11802 1"], enabled: true, image: "⚔️", currency: "USD" },
  { id: "prod-6", server_id: "srv-1", category_id: "cat-3", name: "Mystery Key x5", item_id: 4151, description: "5 keys for the mystery chest", price: 7.99, commands: ["add_item {username} 4151 5"], enabled: true, image: "🔑", currency: "USD" },
  { id: "prod-7", server_id: "srv-1", category_id: "cat-4", name: "Starter Bundle", item_id: null, description: "VIP Rank + 1M Gold + 5 Mystery Keys", price: 19.99, commands: ["add_rank {username} VIP", "add_item {username} 995 1000000", "add_item {username} 4151 5"], enabled: true, image: "📦", currency: "USD" },
];

export const mockOrders: Order[] = [
  { id: "ord-1", server_id: "srv-1", username: "Player123", status: "delivered", total: 49.99, created_at: "2024-12-01T14:30:00Z", items: [{ id: "oi-1", order_id: "ord-1", product_id: "prod-3", product_name: "Legend Rank", quantity: 1, price: 49.99 }] },
  { id: "ord-2", server_id: "srv-1", username: "GamerX", status: "paid", total: 24.98, created_at: "2024-12-02T09:15:00Z", items: [{ id: "oi-2", order_id: "ord-2", product_id: "prod-4", product_name: "1M Gold", quantity: 2, price: 4.99 }, { id: "oi-3", order_id: "ord-2", product_id: "prod-5", product_name: "Armadyl Godsword", quantity: 1, price: 14.99 }] },
  { id: "ord-3", server_id: "srv-1", username: "PKMaster", status: "pending", total: 9.99, created_at: "2024-12-03T18:45:00Z", items: [{ id: "oi-4", order_id: "ord-3", product_id: "prod-1", product_name: "VIP Rank", quantity: 1, price: 9.99 }] },
  { id: "ord-4", server_id: "srv-1", username: "NoobSlayer", status: "delivered", total: 19.99, created_at: "2024-12-04T11:00:00Z", items: [{ id: "oi-5", order_id: "ord-4", product_id: "prod-7", product_name: "Starter Bundle", quantity: 1, price: 19.99 }] },
  { id: "ord-5", server_id: "srv-1", username: "DarkKnight", status: "failed", total: 7.99, created_at: "2024-12-05T16:20:00Z", items: [{ id: "oi-6", order_id: "ord-5", product_id: "prod-6", product_name: "Mystery Key x5", quantity: 1, price: 7.99 }] },
];

export const mockVotes: Vote[] = [
  { id: "v-1", server_id: "srv-1", username: "Player123", vote_site: "RuneLocus", timestamp: "2024-12-05T08:00:00Z" },
  { id: "v-2", server_id: "srv-1", username: "GamerX", vote_site: "TopG", timestamp: "2024-12-05T08:30:00Z" },
  { id: "v-3", server_id: "srv-1", username: "PKMaster", vote_site: "RuneLocus", timestamp: "2024-12-05T09:00:00Z" },
  { id: "v-4", server_id: "srv-1", username: "NoobSlayer", vote_site: "RSPS-List", timestamp: "2024-12-05T10:15:00Z" },
  { id: "v-5", server_id: "srv-1", username: "DarkKnight", vote_site: "TopG", timestamp: "2024-12-05T11:45:00Z" },
];

export const mockDashboardStats: DashboardStats = {
  total_revenue: 1247.85,
  total_orders: 89,
  total_votes: 432,
  active_products: 7,
  revenue_change: 12.5,
  orders_change: 8.3,
};

export const revenueChartData = [
  { name: "Mon", revenue: 120 },
  { name: "Tue", revenue: 180 },
  { name: "Wed", revenue: 95 },
  { name: "Thu", revenue: 240 },
  { name: "Fri", revenue: 310 },
  { name: "Sat", revenue: 420 },
  { name: "Sun", revenue: 280 },
];
