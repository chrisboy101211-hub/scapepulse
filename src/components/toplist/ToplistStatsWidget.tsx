import { useEffect, useState } from "react"
import { CalendarDays, History, Server, Vote } from "lucide-react"
import { toplistDataService } from "@/lib/toplist-data"

type ToplistStats = {
  servers: number
  votesThisMonth: number
  votesLastMonth: number
  overallVotes: number
}

const emptyStats: ToplistStats = { servers: 0, votesThisMonth: 0, votesLastMonth: 0, overallVotes: 0 }

export function ToplistStatsWidget() {
  const [stats, setStats] = useState<ToplistStats>(emptyStats)

  useEffect(() => {
    toplistDataService.getServers({ limit: 100 })
      .then(({ servers, pagination }) => {
        const votesThisMonth = servers.reduce((total, server) => total + server.monthly_votes, 0)
        const overallVotes = servers.reduce((total, server) => total + server.votes, 0)
        setStats({
          servers: pagination.totalCount,
          votesThisMonth,
          votesLastMonth: Math.max(overallVotes - votesThisMonth, 0),
          overallVotes,
        })
      })
      .catch(() => setStats(emptyStats))
  }, [])

  const rows = [
    { label: "Servers", value: stats.servers, icon: Server },
    { label: "Votes this month", value: stats.votesThisMonth, icon: CalendarDays },
    { label: "Votes last month", value: stats.votesLastMonth, icon: History },
    { label: "Overall votes", value: stats.overallVotes, icon: Vote },
  ]

  return (
    <section className="min-h-[328px] border border-primary/45 bg-card/70 shadow-lg shadow-black/10">
      <h2 className="bg-primary/80 px-3 py-2.5 text-center text-sm font-bold tracking-wide text-primary-foreground">Toplist Stats</h2>
      <dl className="px-3">
        {rows.map(({ label, value, icon: Icon }, index) => (
          <div key={label} className={`flex items-center justify-between gap-2 py-3 ${index < rows.length - 1 ? "border-b border-border/60" : ""}`}>
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}</dt>
            <dd className="text-base font-medium text-foreground">{value.toLocaleString()}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
