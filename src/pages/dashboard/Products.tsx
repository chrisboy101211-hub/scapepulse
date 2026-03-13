import { useEffect, useState } from "react"
import { dataService } from "@/lib/data"
import { useServers } from "@/lib/server-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Pencil, ToggleLeft, ToggleRight, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Product, Category } from "@/lib/mock-data"

const Products = () => {
  const { selectedServer } = useServers()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "🎁",
    server_id: "",
    category_id: "",
    commands: "",
    enabled: true,
  })

  useEffect(() => {
    loadData()
  }, [selectedServer])

  const loadData = async () => {
    if (!selectedServer) {
      setProducts([])
      setCategories([])
      setLoading(false)
      return
    }
    try {
      const [productsData, categoriesData] = await Promise.all([
        dataService.getProducts(selectedServer.id),
        dataService.getCategories(selectedServer.id)
      ])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedServer) {
      setFormData(prev => ({ ...prev, server_id: selectedServer.id }))
    }
  }, [selectedServer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price || !formData.server_id || !formData.category_id) {
      toast.error("Please fill in required fields")
      return
    }
    setSubmitting(true)
    try {
      const commands = formData.commands.split("\n").filter(c => c.trim())
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        image: formData.image,
        server_id: formData.server_id,
        category_id: formData.category_id,
        commands,
        enabled: formData.enabled,
      }
      
      if (editingProduct) {
        await dataService.updateProduct(editingProduct.id, productData)
        toast.success("Product updated!")
      } else {
        await dataService.createProduct(productData)
        toast.success("Product created!")
      }
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to save product")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (product: Product) => {
    try {
      await dataService.updateProduct(product.id, { enabled: !product.enabled })
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update product")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    try {
      await dataService.deleteProduct(id)
      toast.success("Product deleted!")
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product")
    }
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      image: product.image || "🎁",
      server_id: product.server_id,
      category_id: product.category_id,
      commands: (product.commands || []).join("\n"),
      enabled: product.enabled,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingProduct(null)
    setFormData({
      name: "",
      description: "",
      price: "",
      image: "🎁",
      server_id: servers[0]?.id || "",
      category_id: "",
      commands: "",
      enabled: true,
    })
  }

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage items in your store</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editingProduct ? "Update product details" : "Create a new product for your store"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" placeholder="VIP Rank" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input id="price" type="number" step="0.01" placeholder="9.99" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Product description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Server *</Label>
                  <Select value={formData.server_id} onValueChange={(v) => setFormData({ ...formData, server_id: v, category_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select server" /></SelectTrigger>
                    <SelectContent>
                      {servers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.filter(c => c.server_id === formData.server_id).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Emoji Icon</Label>
                <Input id="image" placeholder="🎁" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commands">Commands (one per line)</Label>
                <Input id="commands" placeholder="add_rank {username} VIP&#10;add_item {username} 995 1000000" value={formData.commands} onChange={(e) => setFormData({ ...formData, commands: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="hero" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingProduct ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No products found. Add your first product to get started.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{product.image}</span>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{getCategoryName(product.category_id)}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">${Number(product.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${product.enabled ? "bg-neon-green/10 text-neon-green" : "bg-muted text-muted-foreground"}`}>
                      {product.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(product)}>
                        {product.enabled ? <ToggleRight className="h-5 w-5 text-neon-green" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(product)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
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

export default Products;
