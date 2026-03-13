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
import { Plus, GripVertical, Pencil, Loader2, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Category } from "@/lib/mock-data"

const Categories = () => {
  const { selectedServer, servers } = useServers()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    numeric_id: "",
    description: "",
    server_id: "",
    display_order: 0,
    enabled: true,
  })

  useEffect(() => {
    loadData()
  }, [selectedServer])

  const loadData = async () => {
    if (!selectedServer) {
      setCategories([])
      setLoading(false)
      return
    }
    try {
      const categoriesData = await dataService.getCategories(selectedServer.id)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Failed to load categories:", error)
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
    if (!formData.name || !formData.server_id) {
      toast.error("Please fill in required fields")
      return
    }
    setSubmitting(true)
    try {
      const categoryData = {
        name: formData.name,
        numeric_id: formData.numeric_id ? parseInt(formData.numeric_id) : null,
        description: formData.description,
        display_order: formData.display_order,
        enabled: formData.enabled,
      }
      
      if (editingCategory) {
        await dataService.updateCategory(editingCategory.id, categoryData)
        toast.success("Category updated!")
      } else {
        await dataService.createCategory({
          ...categoryData,
          server_id: formData.server_id,
        })
        toast.success("Category created!")
      }
      setDialogOpen(false)
      resetForm()
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to save category")
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (cat: Category) => {
    try {
      await dataService.updateCategory(cat.id, { enabled: !cat.enabled })
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to update category")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return
    try {
      await dataService.deleteCategory(id)
      toast.success("Category deleted!")
      loadData()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete category")
    }
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      numeric_id: cat.numeric_id ? String(cat.numeric_id) : "",
      description: cat.description || "",
      server_id: cat.server_id,
      display_order: cat.display_order,
      enabled: cat.enabled,
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingCategory(null)
    setFormData({
      name: "",
      numeric_id: "",
      description: "",
      server_id: selectedServer?.id || "",
      display_order: categories.length,
      enabled: true,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
              <DialogDescription>
                {editingCategory ? "Update category details" : "Create a new product category"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Ranks, Items, Keys"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeric_id">Category ID</Label>
                  <Input
                    id="numeric_id"
                    type="number"
                    placeholder="1"
                    value={formData.numeric_id}
                    onChange={(e) => setFormData({ ...formData, numeric_id: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Server</Label>
                <Select value={formData.server_id} onValueChange={(v) => setFormData({ ...formData, server_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select server" />
                  </SelectTrigger>
                  <SelectContent>
                    {servers.map((server) => (
                      <SelectItem key={server.id} value={server.id}>{server.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" variant="hero" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {editingCategory ? "Update" : "Create"}
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
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No categories found. Add your first category to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20">
              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
              <div className="flex-1">
                <h3 className="font-medium">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggle(cat)}>
                {cat.enabled ? <ToggleRight className="h-5 w-5 text-neon-green" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
              </Button>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.enabled ? "bg-neon-green/10 text-neon-green" : "bg-muted text-muted-foreground"}`}>
                {cat.enabled ? "Active" : "Disabled"}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cat.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
