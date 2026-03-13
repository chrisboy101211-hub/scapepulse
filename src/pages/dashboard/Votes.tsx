import { useEffect, useState } from "react"
import { dataService } from "@/lib/data"
import { useServers } from "@/lib/server-context"
import { Loader2 } from "lucide-react"
import type { Vote } from "@/lib/mock-data"

const Votes = () => {
  const { selectedServer } = useServers()
  const [votes, setVotes] = useState<Vote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedServer])

  const loadData = async () => {
    if (!selectedServer) {
      setVotes([])
      setLoading(false)
      return
    }
    try {
      const votesData = await dataService.getVotes(selectedServer.id)
      setVotes(votesData)
    } catch (error) {
      console.error("Failed to load votes:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Votes</h1>
        <p className="text-sm text-muted-foreground">Track player votes and reward delivery</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : votes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No votes yet. Share your server to get votes!
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">Player</th>
                <th className="px-4 py-3 text-left font-medium">Vote Site</th>
                <th className="px-4 py-3 text-right font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {votes.map((vote) => (
                <tr key={vote.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{vote.username}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">{vote.vote_site}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">
                    {new Date(vote.timestamp).toLocaleString()}
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

export default Votes;
