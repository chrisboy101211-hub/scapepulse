import { supabase } from "./supabase"
import type { Server, Category, Product, Order, OrderItem, Vote, DashboardStats } from "./mock-data"

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
  }
};
