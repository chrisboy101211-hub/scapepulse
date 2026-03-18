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

  async getHiscores(serverId: string, skill?: string, gameMode?: string) {
    let query = supabase.from("hiscores").select("*").eq("server_id", serverId);

    if (gameMode) query = query.eq("game_mode", gameMode);

    if (skill && skill !== "overall") {
      query = query.order(`skill_xp->>${skill}` as any, { ascending: false });
    } else {
      query = query.order("total_xp", { ascending: false });
    }

    const { data, error } = await query.limit(100);
    if (error) throw error;
    return data || [];
  },

  async getBossHiscores(serverId: string, bossName: string, gameMode?: string) {
    const { data, error } = await supabase.rpc("get_boss_leaderboard", {
      p_server_id: serverId,
      p_boss_name: bossName,
      p_game_mode: gameMode ?? null,
      p_limit: 50,
    });
    if (error) throw error;
    return data || [];
  },

  async getHiscoresBosses(serverId: string) {
    const { data, error } = await supabase
      .from("hiscores_bosses")
      .select("*")
      .eq("server_id", serverId)
      .eq("enabled", true)
      .order("ordinal");
    if (error) throw error;
    return data || [];
  },

  async getBossesForServer(serverId: string) {
    const { data } = await supabase.from("hiscores_bosses").select("*").eq("server_id", serverId).order("ordinal");
    return data || [];
  },

  async updateBoss(id: string, updates: { enabled?: boolean; display_name?: string }) {
    const { error } = await supabase.from("hiscores_bosses").update(updates).eq("id", id);
    if (error) throw error;
  },

  async seedBossDefaults(serverId: string) {
    const bosses = [
      { name: "zulrah", display_name: "Zulrah", icon_url: "https://oldschool.runescape.wiki/images/Zulrah.png", ordinal: 1 },
      { name: "vorkath", display_name: "Vorkath", icon_url: "https://oldschool.runescape.wiki/images/Vorkath.png", ordinal: 2 },
      { name: "theatre_of_blood", display_name: "Theatre of Blood", icon_url: "https://oldschool.runescape.wiki/images/Theatre_of_Blood_logo.png", ordinal: 3 },
      { name: "tombs_of_amascut", display_name: "Tombs of Amascut", icon_url: "https://oldschool.runescape.wiki/images/Tombs_of_Amascut_logo.png", ordinal: 4 },
      { name: "nex", display_name: "Nex", icon_url: "https://oldschool.runescape.wiki/images/Nex.png", ordinal: 5 },
      { name: "nightmare", display_name: "The Nightmare", icon_url: "https://oldschool.runescape.wiki/images/The_Nightmare.png", ordinal: 6 },
      { name: "corporeal_beast", display_name: "Corporeal Beast", icon_url: "https://oldschool.runescape.wiki/images/Corporeal_Beast.png", ordinal: 7 },
      { name: "king_black_dragon", display_name: "King Black Dragon", icon_url: "https://oldschool.runescape.wiki/images/King_Black_Dragon.png", ordinal: 8 },
      { name: "kalphite_queen", display_name: "Kalphite Queen", icon_url: "https://oldschool.runescape.wiki/images/Kalphite_Queen.png", ordinal: 9 },
      { name: "general_graardor", display_name: "General Graardor", icon_url: "https://oldschool.runescape.wiki/images/General_Graardor.png", ordinal: 10 },
      { name: "commander_zilyana", display_name: "Commander Zilyana", icon_url: "https://oldschool.runescape.wiki/images/Commander_Zilyana.png", ordinal: 11 },
      { name: "kreearra", display_name: "Kree'arra", icon_url: "https://oldschool.runescape.wiki/images/Kree%27arra.png", ordinal: 12 },
      { name: "kril_tsutsaroth", display_name: "K'ril Tsutsaroth", icon_url: "https://oldschool.runescape.wiki/images/K%27ril_Tsutsaroth.png", ordinal: 13 },
      { name: "cerberus", display_name: "Cerberus", icon_url: "https://oldschool.runescape.wiki/images/Cerberus.png", ordinal: 14 },
      { name: "alchemical_hydra", display_name: "Alchemical Hydra", icon_url: "https://oldschool.runescape.wiki/images/Alchemical_Hydra.png", ordinal: 15 },
      { name: "kraken", display_name: "Kraken", icon_url: "https://oldschool.runescape.wiki/images/Kraken.png", ordinal: 16 },
      { name: "dagannoth_prime", display_name: "Dagannoth Prime", icon_url: "https://oldschool.runescape.wiki/images/Dagannoth_Prime.png", ordinal: 17 },
      { name: "dagannoth_rex", display_name: "Dagannoth Rex", icon_url: "https://oldschool.runescape.wiki/images/Dagannoth_Rex.png", ordinal: 18 },
      { name: "dagannoth_supreme", display_name: "Dagannoth Supreme", icon_url: "https://oldschool.runescape.wiki/images/Dagannoth_Supreme.png", ordinal: 19 },
      { name: "abyssal_sire", display_name: "Abyssal Sire", icon_url: "https://oldschool.runescape.wiki/images/Abyssal_Sire.png", ordinal: 20 },
      { name: "chaos_elemental", display_name: "Chaos Elemental", icon_url: "https://oldschool.runescape.wiki/images/Chaos_Elemental.png", ordinal: 21 },
      { name: "giant_mole", display_name: "Giant Mole", icon_url: "https://oldschool.runescape.wiki/images/Giant_Mole.png", ordinal: 22 },
      { name: "grotesque_guardians", display_name: "Grotesque Guardians", icon_url: "https://oldschool.runescape.wiki/images/Grotesque_Guardians.png", ordinal: 23 },
      { name: "sarachnis", display_name: "Sarachnis", icon_url: "https://oldschool.runescape.wiki/images/Sarachnis.png", ordinal: 24 },
      { name: "scorpia", display_name: "Scorpia", icon_url: "https://oldschool.runescape.wiki/images/Scorpia.png", ordinal: 25 },
      { name: "skotizo", display_name: "Skotizo", icon_url: "https://oldschool.runescape.wiki/images/Skotizo.png", ordinal: 26 },
      { name: "tzkal_zuk", display_name: "TzKal-Zuk", icon_url: "https://oldschool.runescape.wiki/images/TzKal-Zuk.png", ordinal: 27 },
      { name: "tztok_jad", display_name: "TzTok-Jad", icon_url: "https://oldschool.runescape.wiki/images/TzTok-Jad.png", ordinal: 28 },
      { name: "venenatis", display_name: "Venenatis", icon_url: "https://oldschool.runescape.wiki/images/Venenatis.png", ordinal: 29 },
      { name: "vetion", display_name: "Vet'ion", icon_url: "https://oldschool.runescape.wiki/images/Vet%27ion.png", ordinal: 30 },
      { name: "callisto", display_name: "Callisto", icon_url: "https://oldschool.runescape.wiki/images/Callisto.png", ordinal: 31 },
      { name: "barrows", display_name: "Barrows Chests", icon_url: "https://oldschool.runescape.wiki/images/Barrows_icon.png", ordinal: 32 },
      { name: "thermonuclear_smoke_devil", display_name: "Thermonuclear Smoke Devil", icon_url: "https://oldschool.runescape.wiki/images/Thermonuclear_Smoke_Devil.png", ordinal: 33 },
      { name: "vardorvis", display_name: "Vardorvis", icon_url: "https://oldschool.runescape.wiki/images/Vardorvis.png", ordinal: 34 },
      { name: "duke_sucellus", display_name: "Duke Sucellus", icon_url: "https://oldschool.runescape.wiki/images/Duke_Sucellus.png", ordinal: 35 },
      { name: "whisperer", display_name: "The Whisperer", icon_url: "https://oldschool.runescape.wiki/images/The_Whisperer.png", ordinal: 36 },
      { name: "leviathan", display_name: "The Leviathan", icon_url: "https://oldschool.runescape.wiki/images/The_Leviathan.png", ordinal: 37 },
      { name: "phantom_muspah", display_name: "Phantom Muspah", icon_url: "https://oldschool.runescape.wiki/images/Phantom_Muspah.png", ordinal: 38 },
      { name: "tempoross", display_name: "Tempoross", icon_url: "https://oldschool.runescape.wiki/images/Tempoross.png", ordinal: 39 },
      { name: "wintertodt", display_name: "Wintertodt", icon_url: "https://oldschool.runescape.wiki/images/Wintertodt.png", ordinal: 40 },
    ];
    const ts = Date.now();
    const rows = bosses.map((b, i) => ({
      id: `boss-${serverId}-${b.name}-${ts}-${i}`,
      server_id: serverId,
      name: b.name,
      display_name: b.display_name,
      icon_url: b.icon_url,
      ordinal: b.ordinal,
      enabled: true,
    }));
    // upsert — if boss already exists for this server, skip it
    const { error } = await supabase
      .from("hiscores_bosses")
      .upsert(rows, { onConflict: "server_id,name", ignoreDuplicates: true });
    if (error) throw error;
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

  async seedSkillDefaults(serverId: string) {
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
    const ts = Date.now();
    const rows = defaultSkills.map((sk, i) => ({
      id: `sk-${serverId}-${sk.name}-${ts}-${i}`,
      server_id: serverId,
      name: sk.name,
      display_name: sk.display_name,
      icon_url: sk.icon_url,
      ordinal: sk.ordinal,
      enabled: true,
    }));
    const { error } = await supabase
      .from("hiscores_skills")
      .upsert(rows, { onConflict: "server_id,name", ignoreDuplicates: true });
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
  },

  async getServerTheme(serverId: string) {
    const { data, error } = await supabase
      .from("servers")
      .select("theme_hiscores_accent, theme_hiscores_bg, theme_store_accent, theme_store_bg, theme_vote_accent, theme_vote_bg, logo_url, pill_logo_url")
      .eq("id", serverId)
      .single();
    if (error) return null;
    return data;
  },

  async updateServerTheme(serverId: string, theme: {
    theme_hiscores_accent?: string;
    theme_hiscores_bg?: string;
    theme_store_accent?: string;
    theme_store_bg?: string;
    theme_vote_accent?: string;
    theme_vote_bg?: string;
    logo_url?: string | null;
    pill_logo_url?: string | null;
  }) {
    const { data, error } = await supabase.from("servers").update(theme).eq("id", serverId).select();
    if (error) throw error;
    return data?.[0] || null;
  },

  async getServerPaymentGateway(serverId: string, provider = "paypal") {
    const { data, error } = await supabase
      .from("server_payment_gateways")
      .select("paypal_client_id, paypal_email, paypal_mode, hidden, basket_limit_enabled, basket_limit_amount, instant_payments_only, checkout_language, require_shipping_address, verified_addresses_only, verified_paypal_accounts_only, enabled")
      .eq("server_id", serverId)
      .eq("provider", provider)
      .eq("enabled", true)
      .single();
    if (error) return null;
    return data;
  },
};
