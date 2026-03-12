import { DollarSign, ShoppingCart, Vote, Package } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import StatCard from "@/components/StatCard";
import { mockDashboardStats, revenueChartData, mockOrders } from "@/lib/mock-data";

const Overview = () => {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your server performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={`$${stats.total_revenue.toLocaleString()}`} change={stats.revenue_change} icon={DollarSign} />
        <StatCard title="Total Orders" value={stats.total_orders.toString()} change={stats.orders_change} icon={ShoppingCart} />
        <StatCard title="Total Votes" value={stats.total_votes.toString()} icon={Vote} />
        <StatCard title="Active Products" value={stats.active_products.toString()} icon={Package} />
      </div>

      {/* Revenue Chart */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Revenue This Week</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueChartData}>
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
              {mockOrders.slice(0, 5).map((order) => (
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
                  <td className="py-3 text-right font-mono">${order.total.toFixed(2)}</td>
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
