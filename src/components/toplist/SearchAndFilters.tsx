import { useState } from "react"

interface Filters {
  search: string
  revision: string
  serverType: string
}

interface SearchAndFiltersProps {
  onSearch?: (filters: Filters) => void
}

const REVISION_OPTIONS = ["OSRS", "RS2", "RS3 (EOC)", "Custom/Modified", "Pre-EOC", "Legacy"]
const SERVER_TYPE_OPTIONS = ["Economy", "PvP", "PvM", "Skilling", "Custom", "Hardcore", "Ironman", "HCIM", "Spawn", "Hybrid", "Pure", "Max"]

export function SearchAndFilters({ onSearch }: SearchAndFiltersProps) {
  const [filters, setFilters] = useState<Filters>({ search: "", revision: "", serverType: "" })

  const handle = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value }
    setFilters(next)
    onSearch?.(next)
  }

  const clear = () => {
    const cleared = { search: "", revision: "", serverType: "" }
    setFilters(cleared)
    onSearch?.(cleared)
  }

  return (
    <div className="bg-card p-6 rounded-lg border border-border mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">Search Servers</label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handle("search", e.target.value)}
            placeholder="Search by name or description..."
            className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Revision</label>
          <select value={filters.revision} onChange={(e) => handle("revision", e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground">
            <option value="">All Revisions</option>
            {REVISION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Type</label>
          <select value={filters.serverType} onChange={(e) => handle("serverType", e.target.value)}
            className="w-full px-3 py-2 bg-input border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground">
            <option value="">All Types</option>
            {SERVER_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>
      {(filters.search || filters.revision || filters.serverType) && (
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Filters applied</span>
          <button onClick={clear} className="text-sm text-primary hover:text-primary/80 transition-colors">
            Clear all filters
          </button>
        </div>
      )}
    </div>
  )
}
