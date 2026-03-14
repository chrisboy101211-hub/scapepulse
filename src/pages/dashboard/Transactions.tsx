import { useEffect, useState } from "react"
import { dataService } from "@/lib/data"
import { useServers } from "@/lib/server-context"
import type { PendingTransaction } from "@/lib/mock-data"
import { Loader2, Plus, Trash2, CheckCircle, Clock, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const statusConfig = {
  pending: { label: "Pending", icon: Clock, className: "bg-accent/10 text-accent" },
  paid: { label: "Paid", icon: CheckCircle, className: "bg-primary/10 text-primary" },
  failed: { label: "Failed", icon: XCircle, className: "bg-destructive/10 text-destructive" },
  claimed: { label: "Claimed", icon: CheckCircle, className: "bg-emerald-500/10 text-emerald-500" },
}

const Transactions = () => {
  const { selectedServer } = useServers()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<PendingTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    username: "",
    product_name: "",
    quantity: "1",
    price: "",
    transaction_id: "",
  })

  useEffect(() => {
    loadTransactions()
  }, [selectedServer])

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

  const handleCreate = async () => {
    if (!selectedServer) return
    if (!form.username || !form.product_name || !form.price || !form.transaction_id) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    setCreating(true)
    try {
      const qty = parseInt(form.quantity) || 1
      const price = parseFloat(form.price)
      await dataService.createPendingTransaction({
        server_id: selectedServer.id,
        username: form.username,
        cart_items: [{ product_id: "", product_name: form.product_name, quantity: qty, price }],
        total: price * qty,
        transaction_id: form.transaction_id,
        status: "pending",
        claimed: false,
      })
      toast({ title: "Transaction created" })
      setCreateOpen(false)
      setForm({ username: "", product_name: "", quantity: "1", price: "", transaction_id: "" })
      loadTransactions()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create transaction"
      toast({ title: "Error", description: message, variant: "destructive" })
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">Manage pending transactions and payment records</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Transaction
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No transactions found.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Transaction ID</th>
                <th className="px-4 py-3 text-left font-medium">Player</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Claimed</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 text-right font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const cfg = statusConfig[tx.status] ?? statusConfig.pending
                const Icon = cfg.icon
                return (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{tx.transaction_id}</td>
                    <td className="px-4 py-3 font-medium">{tx.username}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {tx.cart_items?.map((item) => `${item.product_name} ×${item.quantity}`).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        tx.claimed
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {tx.claimed ? "Claimed" : "Unclaimed"}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Player Username *</Label>
              <Input
                placeholder="e.g. PlayerOne"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Product / Item Name *</Label>
              <Input
                placeholder="e.g. VIP Rank"
                value={form.product_name}
                onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price (USD) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="9.99"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Transaction ID *</Label>
              <Input
                placeholder="e.g. PAYID-abc123"
                value={form.transaction_id}
                onChange={(e) => setForm((f) => ({ ...f, transaction_id: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Transactions
