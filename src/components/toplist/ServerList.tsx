import { useState, useEffect } from "react"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"
import { ToplistServerCard } from "./ToplistServerCard"

interface ServerListProps {
  filters?: { search: string; revision: string; serverType: string }
}

export function ServerList({ filters }: ServerListProps) {
  const [servers, setServers] = useState<ToplistServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pagination, setPagination] = useState({ page: 1, limit: 35, totalCount: 0, totalPages: 0 })

  const fetchServers = async (page = 1) => {
    setLoading(true)
    try {
      const result = await toplistDataService.getServers({
        search: filters?.search,
        revision: filters?.revision,
        serverType: filters?.serverType,
        page,
        limit: 35,
      })
      setServers(result.servers)
      setPagination(result.pagination)
    } catch {
      setError("Failed to load servers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServers(1)
  }, [filters?.search, filters?.revision, filters?.serverType])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-card p-6 rounded-lg border border-border animate-pulse h-[120px]" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <button onClick={() => fetchServers(1)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
          Try Again
        </button>
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-card border border-border rounded-lg p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-foreground mb-2">No servers found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm text-muted-foreground">{pagination.totalCount} servers found</span>
      </div>

      <div className="space-y-4 mb-8">
        {servers.map((server, index) => (
          <ToplistServerCard
            key={server.id}
            server={server}
            rank={index + 1 + (pagination.page - 1) * pagination.limit}
            onVote={() => fetchServers(pagination.page)}
          />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => fetchServers(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
            className="px-4 py-2 border border-border rounded-md text-sm bg-card hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
          <button
            onClick={() => fetchServers(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={pagination.page === pagination.totalPages}
            className="px-4 py-2 border border-border rounded-md text-sm bg-card hover:bg-secondary disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
