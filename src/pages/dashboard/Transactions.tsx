import { useEffect, useState } from "react"
import { dataService } from "@/lib/data"
import { useServers } from "@/lib/server-context"
import type { PendingTransaction, Product } from "@/lib/mock-data"
import { Loader2, Plus, Trash2, CheckCircle, Clock, XCircle, ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-accent/10 text-accent" },
  paid: { label: "Paid", icon: CheckCircle, className: "bg-primary/10 text-primary" },
  failed: { label: "Failed", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  claimed: { label: "Claimed", icon: CheckCircle, className: "bg-emerald-500/10 text-emerald-500" },
}

const EMPTY_FORM = {
  username: "",
  product_id: "",
  quantity: "1",
  delivery_status: "waiting", // "waiting" | "complete"
}

const Transactions = () => {
  const { selectedServer } = useServers()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<PendingTransaction[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"list" | "create">("list")
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    loadTransactions()
  }, [selectedServer])

  useEffect(() => {
    if (view === "create" && selectedServer) {
      dataService.getAllProducts(selectedServer.id).then(setProducts).catch(() => setProducts([]))
    }
  }, [view, selectedServer])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const data = await dataService.getPendingTransactions(selectedServer?.id)
      setTransactions(data)
    } catch (error) {
      console.error("Failed to load transactions:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === form.product_id) ?? null

  const handleSubmit = async () => {
    if (!selectedServer) return
    if (!form.username.trim()) {
      toast({ title: "Missing field", description: "Player username is required.", variant: "destructive" })
      return
    }
    if (!form.product_id || !selectedProduct) {
      toast({ title: "Missing field", description: "Please choose a product.", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const qty = Math.max(1, parseInt(form.quantity) || 1)
      const price = Number(selectedProduct.price)
      // "complete" = already delivered manually; "waiting" = let the plugin claim it
      const isComplete = form.delivery_status === "complete"

      await dataService.createPendingTransaction({
        server_id: selectedServer.id,
        username: form.username.trim(),
        cart_items: [{
          id: selectedProduct.numeric_id ?? selectedProduct.id,
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          quantity: qty,
          price,
        }] as any,
        total: price * qty,
        transaction_id: `manual-${Date.now()}`,
        status: isComplete ? "claimed" : "paid",
        claimed: isComplete,
      })

      toast({ title: "Transaction created", description: isComplete ? "Marked as delivered." : "Waiting for player to claim." })
      setForm(EMPTY_FORM)
      setView("list")
      loadTransactions()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      toast({ title: "Failed to create transaction", description: msg, variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await dataService.deletePendingTransaction(id)
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      toast({ title: "Transaction deleted" })
    } catch {
      toast({ title: "Error", description: "Failed to delete transaction.", variant: "destructive" })
    }
  }

  // ── Create view ──────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="space-y-6">
        {/* Header + breadcrumb */}
        <div>
          <h1 className="font-display text-2xl font-bold">Create Transaction</h1>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <Home className="h-3.5 w-3.5" />
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => setView("list")} className="hover:text-foreground transition-colors">
              Transactions
            </button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">Create Transaction</span>
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-lg border border-border bg-card p-6 space-y-6">
          <p className="text-sm text-muted-foreground">Create a new purchase / transaction</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Player */}
            <div className="space-y-2">
              <Label>Player</Label>
              <Input
                placeholder="Username or ID"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">The username or ID of the player.</p>
            </div>

            {/* Product */}
            <div className="space-y-2">
              <Label>Product</Label>
              <select
                value={form.product_id}
                onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Choose the product you wish to give to the user.</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${Number(p.price).toFixed(2)}
                  </option>
                ))}
              </select>
              {products.length === 0 && (
                <p className="text-xs text-muted-foreground">No products found for this server.</p>
              )}
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                placeholder="Quantity"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">The amount to give to the player.</p>
            </div>

            {/* Delivery Status */}
            <div className="space-y-2">
              <Label>Delivery Status</Label>
              <select
                value={form.delivery_status}
                onChange={(e) => setForm((f) => ({ ...f, delivery_status: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="waiting">Waiting on user</option>
                <option value="complete">Complete</option>
              </select>
              <p className="text-xs text-muted-foreground">
                {form.delivery_status === "complete"
                  ? "Complete means that you have already given the product to the user."
                  : "\"Waiting on user\" means that you want our system to handle that for you."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="hero" className="px-10 rounded-full" onClick={handleSubmit} disabled={creating}>
            {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit
          </Button>
        </div>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">Manage pending transactions and payment records</p>
        </div>
        <Button onClick={() => setView("create")} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Transaction
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No transactions found.</div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Transaction ID</th>
                <th className="px-4 py-3 text-left font-medium">Player</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Delivery</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const cfg = statusConfig[tx.status] ?? statusConfig.pending
                const Icon = cfg.icon
                const isDelivered = tx.claimed || tx.status === "claimed"
                return (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.transaction_id}</td>
                    <td className="px-4 py-3 font-medium">{tx.username}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {tx.cart_items?.map((item: any) => `${item.product_name} ×${item.quantity}`).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        isDelivered
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-amber-500/10 text-amber-500"
                      }`}>
                        {isDelivered ? "Complete" : "Waiting on user"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">${Number(tx.total).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(tx.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default Transactions
