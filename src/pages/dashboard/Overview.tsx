import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Vote, Package, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatCard from "@/components/StatCard";
import { dataService } from "@/lib/data";
import type { DashboardStats, Order } from "@/lib/mock-data";

const Overview = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, ordersData] = await Promise.all([
        dataService.getDashboardStats(),
        dataService.getOrders()
      ]);
      setStats(statsData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: "Mon", revenue: 120 },
    { name: "Tue", revenue: 180 },
    { name: "Wed", revenue: 95 },
    { name: "Thu", revenue: 240 },
    { name: "Fri", revenue: 310 },
    { name: "Sat", revenue: 420 },
    { name: "Sun", revenue: 280 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayStats = stats || { total_revenue: 0, total_orders: 0, total_votes: 0, active_products: 0, revenue_change: 0, orders_change: 0 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your server performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`$${displayStats.total_revenue.toLocaleString()}`} change={displayStats.revenue_change} icon={DollarSign} />
        <StatCard title="Total Orders" value={displayStats.total_orders.toString()} change={displayStats.orders_change} icon={ShoppingCart} />
        <StatCard title="Total Votes" value={displayStats.total_votes.toString()} icon={Vote} />
        <StatCard title="Active Products" value={displayStats.active_products.toString()} icon={Package} />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Revenue This Week</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(185 100% 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(185 100% 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(230 12% 16%)" />
              <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{
                  background: "hsl(230 15% 8%)",
                  border: "1px solid hsl(230 12% 16%)",
                  borderRadius: "8px",
                  color: "hsl(210 20% 92%)",
                }}
                formatter={(value: number) => [`$${value}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(185 100% 50%)" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 text-left font-medium">Order</th>
                <th className="pb-3 text-left font-medium">Player</th>
                <th className="pb-3 text-left font-medium">Status</th>
                <th className="pb-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="py-3 font-mono text-xs text-muted-foreground">{order.id}</td>
                  <td className="py-3">{order.username}</td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      order.status === "delivered" ? "bg-neon-green/10 text-neon-green" :
                      order.status === "paid" ? "bg-primary/10 text-primary" :
                      order.status === "pending" ? "bg-accent/10 text-accent" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-right font-mono">${Number(order.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
