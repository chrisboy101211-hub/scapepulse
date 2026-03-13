import { useEffect, useState } from "react"
import { dataService } from "@/lib/data"
import { Loader2 } from "lucide-react"
import type { Order } from "@/lib/mock-data"

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const data = await dataService.getOrders()
      setOrders(data)
    } catch (error) {
      console.error("Failed to load orders:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Orders</h1>
        <p className="text-sm text-muted-foreground">Track purchases and deliveries</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No orders found.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Order ID</th>
                <th className="px-4 py-3 text-left font-medium">Player</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{order.id}</td>
                  <td className="px-4 py-3 font-medium">{order.username}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    Order contains {order.total > 0 ? 'item(s)' : 'items'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      order.status === "delivered" ? "bg-neon-green/10 text-neon-green" :
                      order.status === "paid" ? "bg-primary/10 text-primary" :
                      order.status === "pending" ? "bg-accent/10 text-accent" :
                      "bg-destructive/10 text-destructive"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">${Number(order.total).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
