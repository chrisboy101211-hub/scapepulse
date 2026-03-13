import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Package, Key, Users, Loader2, Copy } from "lucide-react";
import StatCard from "@/components/StatCard";
import { dataService } from "@/lib/data";
import { useServers } from "@/lib/server-context";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Order, Product } from "@/lib/mock-data";

const Overview = () => {
  const { selectedServer } = useServers()
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedServer) {
      loadData();
    }
  }, [selectedServer]);

  const loadData = async () => {
    if (!selectedServer) return;
    setLoading(true);
    try {
      const [ordersData, productsData] = await Promise.all([
        dataService.getOrders(selectedServer.id),
        dataService.getProducts(selectedServer.id)
      ]);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    if (selectedServer?.api_key) {
      navigator.clipboard.writeText(selectedServer.api_key);
      toast.success("API key copied!");
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!selectedServer) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Server Selected</h2>
        <p className="text-muted-foreground">Select a server from the dropdown to view its dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Server Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-4 w-4 rounded-full ${selectedServer.status === "online" ? "bg-neon-green animate-pulse-glow" : "bg-muted-foreground"}`} />
            <div>
              <h1 className="font-display text-2xl font-bold">{selectedServer.name}</h1>
              <p className="text-sm text-muted-foreground">{selectedServer.description}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">API Key</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-secondary px-3 py-1.5 rounded text-sm font-mono">
                {selectedServer.api_key.slice(0, 12)}...
              </code>
              <Button variant="outline" size="sm" onClick={copyApiKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - TeamGames Style */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neon-green/10">
              <DollarSign className="h-5 w-5 text-neon-green" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Key className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Keys</p>
              <p className="text-2xl font-bold">1</p>
            </div>
          </div>
        </div>
        
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table - TeamGames Style */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-display text-lg font-semibold">Purchase History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Transaction ID</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Products</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Username</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No orders yet
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-6 py-4 text-muted-foreground">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{order.id}</td>
                    <td className="px-6 py-4 font-medium">${Number(order.total).toFixed(2)}</td>
                    <td className="px-6 py-4">{order.username}</td>
                    <td className="px-6 py-4">{order.username}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        order.status === "delivered" ? "bg-neon-green/10 text-neon-green" :
                        order.status === "paid" ? "bg-primary/10 text-primary" :
                        order.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                        "bg-destructive/10 text-destructive"
                      }`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Overview;
