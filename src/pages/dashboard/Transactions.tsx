import { useEffect, useRef, useState } from "react"
import { dataService } from "@/lib/data"
import { useServers } from "@/lib/server-context"
import type { PendingTransaction, Product } from "@/lib/mock-data"
import { Loader2, Plus, Trash2, CheckCircle, Clock, XCircle, User, Package, Hash, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"

const statusConfig = {
  pending: { label: "Pending",  icon: Clock,        className: "bg-accent/10 text-accent" },
  paid:    { label: "Paid",     icon: CheckCircle,  className: "bg-primary/10 text-primary" },
  failed:  { label: "Failed",   icon: XCircle,      className: "bg-destructive/10 text-destructive" },
  claimed: { label: "Claimed",  icon: CheckCircle,  className: "bg-emerald-500/10 text-emerald-500" },
}

const EMPTY_FORM = {
  username:        "",
  product_id:      "",
  quantity:        "1",
  delivery_status: "waiting",
}

// Staggered field animation variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
  exit:   { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
}

const fieldVariants = {
  hidden:  { opacity: 0, y: -10, scale: 0.97 },
  visible: { opacity: 1, y: 0,   scale: 1,   transition: { type: "spring", stiffness: 400, damping: 28 } },
  exit:    { opacity: 0, y: -8,  scale: 0.97, transition: { duration: 0.12 } },
}

const dropdownVariants = {
  hidden:  { opacity: 0, y: -12, scale: 0.96 },
  visible: { opacity: 1, y: 0,   scale: 1,   transition: { type: "spring", stiffness: 380, damping: 28, mass: 0.9 } },
  exit:    { opacity: 0, y: -8,  scale: 0.96, transition: { duration: 0.15 } },
}

const Transactions = () => {
  const { selectedServer } = useServers()
  const { toast }          = useToast()
  const [transactions, setTransactions] = useState<PendingTransaction[]>([])
  const [products,     setProducts]     = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [open,     setOpen]     = useState(false)
  const [creating, setCreating] = useState(false)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => { loadTransactions() }, [selectedServer])

  // Load products when dropdown opens
  useEffect(() => {
    if (open && selectedServer) {
      dataService.getAllProducts(selectedServer.id).then(setProducts).catch(() => setProducts([]))
    }
  }, [open, selectedServer])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current  && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const data = await dataService.getPendingTransactions(selectedServer?.id)
      setTransactions(data)
    } catch (err) {
      console.error("Failed to load transactions:", err)
    } finally {
      setLoading(false)
    }
  }

  const selectedProduct = products.find((p) => p.id === form.product_id) ?? null

  const handleSubmit = async () => {
    if (!selectedServer) return
    if (!form.username.trim()) {
      toast({ title: "Missing field", description: "Player username is required.", variant: "destructive" }); return
    }
    if (!form.product_id || !selectedProduct) {
      toast({ title: "Missing field", description: "Please choose a product.", variant: "destructive" }); return
    }
    setCreating(true)
    try {
      const qty        = Math.max(1, parseInt(form.quantity) || 1)
      const price      = Number(selectedProduct.price)
      const isComplete = form.delivery_status === "complete"

      await dataService.createPendingTransaction({
        server_id:      selectedServer.id,
        username:       form.username.trim(),
        cart_items: [{
          id:           selectedProduct.numeric_id ?? selectedProduct.id,
          product_id:   selectedProduct.id,
          product_name: selectedProduct.name,
          quantity:     qty,
          price,
        }] as any,
        total:          price * qty,
        transaction_id: `manual-${Date.now()}`,
        status:         isComplete ? "claimed" : "paid",
        claimed:        isComplete,
      })

      toast({ title: "Transaction created", description: isComplete ? "Marked as delivered." : "Waiting for player to claim." })
      setForm(EMPTY_FORM)
      setOpen(false)
      loadTransactions()
    } catch (err: unknown) {
      toast({ title: "Failed to create transaction", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" })
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

  const fields = [
    {
      key: "player",
      icon: User,
      label: "Player",
      content: (
        <Input
          placeholder="Username or ID"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          className="h-8 text-sm bg-background/60"
          autoFocus
        />
      ),
    },
    {
      key: "product",
      icon: Package,
      label: "Product",
      content: (
        <select
          value={form.product_id}
          onChange={(e) => setForm((f) => ({ ...f, product_id: e.target.value }))}
          className="w-full h-8 rounded-md border border-input bg-background/60 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">Choose a product…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ${Number(p.price).toFixed(2)}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "quantity",
      icon: Hash,
      label: "Quantity",
      content: (
        <Input
          type="number"
          min="1"
          placeholder="1"
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          className="h-8 text-sm bg-background/60"
        />
      ),
    },
    {
      key: "delivery",
      icon: Truck,
      label: "Delivery Status",
      content: (
        <select
          value={form.delivery_status}
          onChange={(e) => setForm((f) => ({ ...f, delivery_status: e.target.value }))}
          className="w-full h-8 rounded-md border border-input bg-background/60 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="waiting">Waiting on user</option>
          <option value="complete">Complete</option>
        </select>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground">Manage pending transactions and payment records</p>
        </div>

        {/* Button + dropdown container */}
        <div className="relative">
          <Button
            ref={buttonRef}
            onClick={() => setOpen((v) => !v)}
            className="gap-2"
          >
            <motion.div
              animate={{ rotate: open ? 45 : 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Plus className="h-4 w-4" />
            </motion.div>
            Create Transaction
          </Button>

          <AnimatePresence>
            {open && (
              <motion.div
                ref={popoverRef}
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-card shadow-2xl shadow-black/20 overflow-hidden"
              >
                {/* Header bar */}
                <div className="px-4 py-3 border-b border-border/60 bg-secondary/30">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">New Transaction</p>
                </div>

                {/* Staggered fields */}
                <motion.div
                  className="p-4 space-y-3"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {fields.map(({ key, icon: Icon, label, content }) => (
                    <motion.div key={key} variants={fieldVariants} className="space-y-1">
                      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon className="h-3 w-3" />
                        {label}
                      </Label>
                      {content}
                    </motion.div>
                  ))}

                  {/* Total preview */}
                  {selectedProduct && (
                    <motion.div
                      variants={fieldVariants}
                      className="flex items-center justify-between rounded-lg bg-primary/5 border border-primary/15 px-3 py-2"
                    >
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-sm font-bold text-primary">
                        ${(Number(selectedProduct.price) * (parseInt(form.quantity) || 1)).toFixed(2)}
                      </span>
                    </motion.div>
                  )}

                  {/* Submit */}
                  <motion.div variants={fieldVariants} className="pt-1">
                    <Button
                      className="w-full h-8 text-sm"
                      onClick={handleSubmit}
                      disabled={creating}
                    >
                      {creating
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                        : <Plus className="h-3.5 w-3.5 mr-2" />
                      }
                      {creating ? "Creating…" : "Submit"}
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Table */}
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
                const cfg  = statusConfig[tx.status] ?? statusConfig.pending
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
