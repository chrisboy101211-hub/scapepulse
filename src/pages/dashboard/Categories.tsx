import { mockCategories } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Plus, GripVertical, Pencil } from "lucide-react";

const Categories = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your products</p>
        </div>
        <Button variant="hero" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="space-y-2">
        {mockCategories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/20">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <div className="flex-1">
              <h3 className="font-medium">{cat.name}</h3>
              <p className="text-sm text-muted-foreground">{cat.description}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cat.enabled ? "bg-neon-green/10 text-neon-green" : "bg-muted text-muted-foreground"}`}>
              {cat.enabled ? "Active" : "Disabled"}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;
