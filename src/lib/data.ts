import { supabase } from "./supabase"
import type { Server, Category, Product, Order, OrderItem, Vote, DashboardStats, PendingTransaction } from "./mock-data"

const getUserId = () => {
  const userData = localStorage.getItem("supabase.auth.token");
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      return parsed?.access_token ? parsed.access_token : null;
    } catch {
      return null;
    }
  }
  return null;
};

export const dataService = {
  async getServers(userId?: string): Promise<Server[]> {
    let query = supabase.from("servers").select("*").order("created_at", { ascending: false });
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getServerBySlug(slug: string): Promise<Server | null> {
    const { data, error } = await supabase.from("servers").select("*").eq("slug", slug).single();
    if (error) return null;
    return data;
  },

  async getCategories(serverId?: string): Promise<Category[]> {
    let query = supabase.from("categories").select("*").eq("enabled", true).order("display_order");
    if (serverId) query = query.eq("server_id", serverId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getProducts(serverId?: string, categoryId?: string): Promise<Product[]> {
    let query = supabase.from("products").select("*").eq("enabled", true);
    if (serverId) query = query.eq("server_id", serverId);
    if (categoryId) query = query.eq("category_id", categoryId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAllProducts(serverId?: string): Promise<Product[]> {
    let query = supabase.from("products").select("*");
    if (serverId) query = query.eq("server_id", serverId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getOrders(serverId?: string): Promise<Order[]> {
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (serverId) query = query.eq("server_id", serverId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    const { data, error } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    if (error) throw error;
    return data || [];
  },

  async getVotes(serverId?: string): Promise<Vote[]> {
    let query = supabase.from("votes").select("*").order("timestamp", { ascending: false });
    if (serverId) query = query.eq("server_id", serverId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getDashboardStats(serverId?: string): Promise<DashboardStats> {
    let ordersQuery = supabase.from("orders").select("total");
    let votesQuery = supabase.from("votes").select("id");
    let productsQuery = supabase.from("products").select("id").eq("enabled", true);

    if (serverId) {
      ordersQuery = ordersQuery.eq("server_id", serverId);
      votesQuery = votesQuery.eq("server_id", serverId);
      productsQuery = productsQuery.eq("server_id", serverId);
    }

    const [ordersResult, votesResult, productsResult] = await Promise.all([
      ordersQuery,
      votesQuery,
      productsQuery
    ]);

    const totalOrders = ordersResult.data?.length || 0;
    const totalVotes = votesResult.data?.length || 0;
    const activeProducts = productsResult.data?.length || 0;
    const totalRevenue = ordersResult.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

    return {
      total_revenue: totalRevenue,
      total_orders: totalOrders,
      total_votes: totalVotes,
      active_products: activeProducts,
      revenue_change: 0,
      orders_change: 0
    };
  },

  async createServer(server: Omit<Server, "id" | "created_at">): Promise<Server> {
    const id = `srv-${Date.now()}`;
    const { data, error } = await supabase.from("servers").insert({ ...server, id }).select().single();
    if (error) throw error;
    
    // Auto-create hiscores configuration for the new server
    await dataService.seedHiscoresDefaults(id);
    
    return data;
  },

  async updateServer(id: string, updates: Partial<Server>): Promise<Server> {
    const { data, error } = await supabase.from("servers").update(updates).eq("id", id).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteServer(id: string): Promise<void> {
    const { error } = await supabase.from("servers").delete().eq("id", id);
    if (error) throw error;
  },

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const id = `prod-${Date.now()}`;
    const { data, error } = await supabase.from("products").insert({ ...product, id }).select().single();
    if (error) throw error;
    return data;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase.from("products").update(updates).eq("id", id).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },

  async createCategory(category: Omit<Category, "id">): Promise<Category> {
    const id = `cat-${Date.now()}`;
    const { data, error } = await supabase.from("categories").insert({ ...category, id }).select().single();
    if (error) throw error;
    return data;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },

  async createOrder(order: Omit<Order, "id" | "created_at">): Promise<Order> {
    const id = `ord-${Date.now()}`;
    const { data, error } = await supabase.from("orders").insert({ ...order, id }).select().single();
    if (error) throw error;
    return data;
  },

  async updateOrderStatus(id: string, status: Order["status"]): Promise<Order> {
    const { data, error } = await supabase.from("orders").update({ status }).eq("id", id).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async createVote(vote: Omit<Vote, "id" | "timestamp">): Promise<Vote> {
    const id = `v-${Date.now()}`;
    const { data, error } = await supabase.from("votes").insert({ ...vote, id }).select().single();
    if (error) throw error;
    return data;
  },

  async getUserSettings(userId: string) {
    const { data, error } = await supabase.from("users").select("*").eq("id", userId).single();
    if (error) return null;
    return data;
  },

  async updateUserSettings(userId: string, updates: { paypal_email?: string; paypal_enabled?: boolean; crypto_enabled?: boolean }) {
    const { data, error } = await supabase.from("users").update(updates).eq("id", userId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async getHiscores(serverId: string, skill?: string) {
    let query = supabase.from("hiscores").select("*").eq("server_id", serverId);
    
    if (skill && skill !== "overall") {
      query = query.order(`${skill}_xp`, { ascending: false });
    } else {
      query = query.order("total_xp", { ascending: false });
    }
    
    const { data, error } = await query.limit(100);
    if (error) throw error;
    return data || [];
  },

  async getPlayerHiscores(serverId: string, username: string) {
    const { data, error } = await supabase
      .from("hiscores")
      .select("*")
      .eq("server_id", serverId)
      .ilike("username", username)
      .single();
    if (error) return null;
    return data;
  },

  async getHiscoresGameModes(serverId: string) {
    const { data, error } = await supabase
      .from("hiscores_game_modes")
      .select("*")
      .eq("server_id", serverId)
      .eq("enabled", true);
    if (error) throw error;
    return data || [];
  },

  async getHiscoresXpModes(serverId: string) {
    const { data, error } = await supabase
      .from("hiscores_xp_modes")
      .select("*")
      .eq("server_id", serverId)
      .eq("enabled", true);
    if (error) throw error;
    return data || [];
  },

  async getHiscoresSkills(serverId: string) {
    const { data, error } = await supabase
      .from("hiscores_skills")
      .select("*")
      .eq("server_id", serverId)
      .eq("enabled", true)
      .order("ordinal");
    if (error) throw error;
    return data || [];
  },

  async createHiscoresGameMode(mode: { server_id: string; name: string; display_name: string; is_default?: boolean }) {
    const id = `gm-${Date.now()}`;
    const { data, error } = await supabase.from("hiscores_game_modes").insert({ ...mode, id }).select().single();
    if (error) throw error;
    return data;
  },

  async updateHiscoresGameMode(id: string, updates: { display_name?: string; is_default?: boolean; enabled?: boolean }) {
    const { data, error } = await supabase.from("hiscores_game_modes").update(updates).eq("id", id).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteHiscoresGameMode(id: string) {
    const { error } = await supabase.from("hiscores_game_modes").delete().eq("id", id);
    if (error) throw error;
  },

  async createHiscoresXpMode(mode: { server_id: string; name: string; display_name: string; xp_multiplier: number; is_default?: boolean }) {
    const id = `xm-${Date.now()}`;
    const { data, error } = await supabase.from("hiscores_xp_modes").insert({ ...mode, id }).select().single();
    if (error) throw error;
    return data;
  },

  async updateHiscoresXpMode(id: string, updates: { display_name?: string; xp_multiplier?: number; is_default?: boolean; enabled?: boolean }) {
    const { data, error } = await supabase.from("hiscores_xp_modes").update(updates).eq("id", id).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteHiscoresXpMode(id: string) {
    const { error } = await supabase.from("hiscores_xp_modes").delete().eq("id", id);
    if (error) throw error;
  },

  async createHiscoresSkill(skill: { server_id: string; name: string; display_name: string; icon_url?: string; ordinal: number }) {
    const id = `sk-${Date.now()}`;
    const { data, error } = await supabase.from("hiscores_skills").insert({ ...skill, id, enabled: true }).select().single();
    if (error) throw error;
    return data;
  },

  async updateHiscoresSkill(id: string, updates: { display_name?: string; icon_url?: string; ordinal?: number; enabled?: boolean }) {
    const { data, error } = await supabase.from("hiscores_skills").update(updates).eq("id", id).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deleteHiscoresSkill(id: string) {
    const { error } = await supabase.from("hiscores_skills").delete().eq("id", id);
    if (error) throw error;
  },

  async toggleServerHiscores(serverId: string, enabled: boolean) {
    const { data, error } = await supabase.from("servers").update({ hiscores_enabled: enabled }).eq("id", serverId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async getPendingTransactions(serverId?: string): Promise<PendingTransaction[]> {
    let query = supabase.from("pending_transactions").select("*").order("created_at", { ascending: false });
    if (serverId) query = query.eq("server_id", serverId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createPendingTransaction(tx: Omit<PendingTransaction, "id" | "created_at" | "updated_at">): Promise<PendingTransaction> {
    const id = `tx-${Date.now()}`;
    const { data, error } = await supabase.from("pending_transactions").insert({ ...tx, id }).select().single();
    if (error) throw error;
    return data;
  },

  async updatePendingTransactionStatus(id: string, status: PendingTransaction["status"], claimed?: boolean): Promise<PendingTransaction> {
    const updates: Partial<PendingTransaction> = { status };
    if (claimed !== undefined) updates.claimed = claimed;
    const { data, error } = await supabase.from("pending_transactions").update(updates).eq("id", id).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async deletePendingTransaction(id: string): Promise<void> {
    const { error } = await supabase.from("pending_transactions").delete().eq("id", id);
    if (error) throw error;
  },

  async seedHiscoresDefaults(serverId: string) {
    const defaultGameModes = [
      { name: "REGULAR", display_name: "Regular", is_default: true, ordinal: 1 },
      { name: "IRONMAN", display_name: "Ironman", is_default: false, ordinal: 2 },
      { name: "ULTIMATE_IRONMAN", display_name: "Ultimate Ironman", is_default: false, ordinal: 3 },
      { name: "HCIM", display_name: "Hardcore Ironman", is_default: false, ordinal: 4 },
    ];

    const defaultXpModes = [
      { name: "NORMAL", display_name: "Normal", xp_multiplier: 1.0, is_default: true, ordinal: 1 },
      { name: "5X", display_name: "5x XP", xp_multiplier: 5.0, is_default: false, ordinal: 2 },
      { name: "10X", display_name: "10x XP", xp_multiplier: 10.0, is_default: false, ordinal: 3 },
      { name: "50X", display_name: "50x XP", xp_multiplier: 50.0, is_default: false, ordinal: 4 },
      { name: "100X", display_name: "100x XP", xp_multiplier: 100.0, is_default: false, ordinal: 5 },
    ];

    const defaultSkills = [
      { name: "attack", display_name: "Attack", icon_url: "https://oldschool.runescape.wiki/images/Attack_icon.png?3ec1e", ordinal: 1 },
      { name: "strength", display_name: "Strength", icon_url: "https://oldschool.runescape.wiki/images/Strength_icon.png?a45b7", ordinal: 2 },
      { name: "defence", display_name: "Defence", icon_url: "https://oldschool.runescape.wiki/images/Defence_icon.png?3ec1e", ordinal: 3 },
      { name: "hitpoints", display_name: "Hitpoints", icon_url: "https://oldschool.runescape.wiki/images/Hitpoints_icon.png?3ec1e", ordinal: 4 },
      { name: "ranged", display_name: "Ranged", icon_url: "https://oldschool.runescape.wiki/images/Ranged_icon.png?3ec1e", ordinal: 5 },
      { name: "prayer", display_name: "Prayer", icon_url: "https://oldschool.runescape.wiki/images/Prayer_icon.png?3ec1e", ordinal: 6 },
      { name: "magic", display_name: "Magic", icon_url: "https://oldschool.runescape.wiki/images/Magic_icon.png?3ec1e", ordinal: 7 },
      { name: "cooking", display_name: "Cooking", icon_url: "https://oldschool.runescape.wiki/images/Cooking_icon.png?3ec1e", ordinal: 8 },
      { name: "woodcutting", display_name: "Woodcutting", icon_url: "https://oldschool.runescape.wiki/images/Woodcutting_icon.png?3ec1e", ordinal: 9 },
      { name: "fletching", display_name: "Fletching", icon_url: "https://oldschool.runescape.wiki/images/Fletching_icon.png?3ec1e", ordinal: 10 },
      { name: "fishing", display_name: "Fishing", icon_url: "https://oldschool.runescape.wiki/images/Fishing_icon.png?3ec1e", ordinal: 11 },
      { name: "firemaking", display_name: "Firemaking", icon_url: "https://oldschool.runescape.wiki/images/Firemaking_icon.png?3ec1e", ordinal: 12 },
      { name: "crafting", display_name: "Crafting", icon_url: "https://oldschool.runescape.wiki/images/Crafting_icon.png?3ec1e", ordinal: 13 },
      { name: "smithing", display_name: "Smithing", icon_url: "https://oldschool.runescape.wiki/images/Smithing_icon.png?3ec1e", ordinal: 14 },
      { name: "mining", display_name: "Mining", icon_url: "https://oldschool.runescape.wiki/images/Mining_icon.png?3ec1e", ordinal: 15 },
      { name: "herblore", display_name: "Herblore", icon_url: "https://oldschool.runescape.wiki/images/Herblore_icon.png?3ec1e", ordinal: 16 },
      { name: "agility", display_name: "Agility", icon_url: "https://oldschool.runescape.wiki/images/Agility_icon.png?3ec1e", ordinal: 17 },
      { name: "thieving", display_name: "Thieving", icon_url: "https://oldschool.runescape.wiki/images/Thieving_icon.png?3ec1e", ordinal: 18 },
      { name: "slayer", display_name: "Slayer", icon_url: "https://oldschool.runescape.wiki/images/Slayer_icon.png?3ec1e", ordinal: 19 },
      { name: "farming", display_name: "Farming", icon_url: "https://oldschool.runescape.wiki/images/Farming_icon.png?3ec1e", ordinal: 20 },
      { name: "runecraft", display_name: "Runecraft", icon_url: "https://oldschool.runescape.wiki/images/Runecraft_icon.png?3ec1e", ordinal: 21 },
      { name: "hunter", display_name: "Hunter", icon_url: "https://oldschool.runescape.wiki/images/Hunter_icon.png?3ec1e", ordinal: 22 },
      { name: "construction", display_name: "Construction", icon_url: "https://oldschool.runescape.wiki/images/Construction_icon.png?3ec1e", ordinal: 23 },
    ];

    const timestamp = Date.now();

    const gameModeInserts = defaultGameModes.map((gm, i) => ({
      id: `gm-${timestamp}-${i}`,
      server_id: serverId,
      name: gm.name,
      display_name: gm.display_name,
      ordinal: gm.ordinal,
      is_default: gm.is_default,
      enabled: true,
    }));

    const xpModeInserts = defaultXpModes.map((xm, i) => ({
      id: `xm-${timestamp}-${i}`,
      server_id: serverId,
      name: xm.name,
      display_name: xm.display_name,
      xp_multiplier: xm.xp_multiplier,
      ordinal: xm.ordinal,
      is_default: xm.is_default,
      enabled: true,
    }));

    const skillInserts = defaultSkills.map((sk, i) => ({
      id: `sk-${timestamp}-${i}`,
      server_id: serverId,
      name: sk.name,
      display_name: sk.display_name,
      icon_url: sk.icon_url,
      ordinal: sk.ordinal,
      enabled: true,
    }));

    await Promise.all([
      supabase.from("hiscores_game_modes").insert(gameModeInserts),
      supabase.from("hiscores_xp_modes").insert(xpModeInserts),
      supabase.from("hiscores_skills").insert(skillInserts),
    ]);
  },

  async getPlatformStats() {
    const { data, error } = await supabase
      .from("platform_stats")
      .select("*")
      .eq("id", "stats-main")
      .single();
    if (error) {
      return { total_servers: 0, total_revenue: 0, total_transactions: 0, uptime_percentage: 99.9 };
    }
    return data;
  }
};
