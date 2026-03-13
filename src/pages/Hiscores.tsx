import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { dataService } from "@/lib/data"
import { Logo } from "@/components/Logo"
import { Loader2, Search, Trophy } from "lucide-react"
import type { Server } from "@/lib/mock-data"

interface Skill {
  id: string;
  name: string;
  display_name: string;
  icon_url: string;
  ordinal: number;
  enabled: boolean;
}

const getSubdomain = () => {
  const hostname = window.location.hostname
  if (hostname.includes("vercel.app") || hostname === "localhost") return null
  const parts = hostname.split(".")
  if (parts.length >= 2) {
    const mainDomain = parts.slice(-2).join(".")
    if (mainDomain === "scapepulse.com" && parts[0] !== "www" && parts[0] !== "scapepulse") {
      return parts[0]
    }
  }
  return null
}

const Hiscores = () => {
  const paramsSlug = useParams()
  const [server, setServer] = useState<Server | null>(null)
  const [hiscores, setHiscores] = useState<any[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeSkill, setActiveSkill] = useState("overall")

  const subdomain = getSubdomain()
  const slug = paramsSlug.slug || subdomain

  useEffect(() => {
    if (slug) loadData()
  }, [slug, activeSkill])

  const loadData = async () => {
    try {
      const serverData = await dataService.getServerBySlug(slug || "")
      setServer(serverData)
      
      if (serverData) {
        const [hiscoresData, skillsData] = await Promise.all([
          dataService.getHiscores(serverData.id, activeSkill),
          dataService.getHiscoresSkills(serverData.id),
        ])
        setHiscores(hiscoresData)
        setSkills(skillsData)
      }
    } catch (error) {
      console.error("Failed to load hiscores:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatXP = (xp: number) => {
    if (xp >= 1000000000) return (xp / 1000000000).toFixed(1) + "B"
    if (xp >= 1000000) return (xp / 1000000).toFixed(1) + "M"
    if (xp >= 1000) return (xp / 1000).toFixed(1) + "K"
    return xp.toString()
  }

  const filteredHiscores = search
    ? hiscores.filter(p => p.username.toLowerCase().includes(search.toLowerCase()))
    : hiscores

  const getSkillLevel = (player: any, skillName: string) => {
    if (skillName === "overall") return player.total_level
    const skillLevels = player.skill_levels
    if (skillLevels && typeof skillLevels === "object") {
      return skillLevels[skillName] || 1
    }
    return player[skillName] || 1
  }

  const getSkillXP = (player: any, skillName: string) => {
    if (skillName === "overall") return Number(player.total_xp)
    const skillXP = player.skill_xp
    if (skillXP && typeof skillXP === "object") {
      return Number(skillXP[skillName] || 0)
    }
    return Number(player[`${skillName}_xp`] || 0)
  }

  const displaySkills = skills.length > 0 
    ? [{ name: "overall", display_name: "Overall", icon_url: "" }, ...skills]
    : [{ name: "overall", display_name: "Overall", icon_url: "" }]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Server not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" />
            </Link>
            <span className="font-display font-bold">{server.name}</span>
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs uppercase text-secondary-foreground">Hiscores</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/store/${server.slug}`}>
              <span className="text-sm text-muted-foreground hover:text-foreground">Store</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 rounded-xl border border-border bg-card p-8 text-center">
          <h1 className="font-display text-3xl font-bold">{server.name} Hiscores</h1>
          <p className="mt-2 text-muted-foreground">Top players by {activeSkill === "overall" ? "total XP" : activeSkill}</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search player..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {displaySkills.slice(0, 8).map((skill) => (
            <button
              key={skill.name}
              onClick={() => setActiveSkill(skill.name)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeSkill === skill.name
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {skill.display_name}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-16">#</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Player</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Level</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">XP</th>
              </tr>
            </thead>
            <tbody>
              {filteredHiscores.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No hiscores data available
                  </td>
                </tr>
              ) : (
                filteredHiscores.map((player, index) => (
                  <tr key={player.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      {index + 1 <= 3 ? (
                        <Trophy className={`h-5 w-5 ${
                          index === 0 ? "text-yellow-500" :
                          index === 1 ? "text-gray-400" :
                          "text-amber-700"
                        }`} />
                      ) : (
                        <span className="text-muted-foreground">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{player.username}</td>
                    <td className="px-4 py-3 text-right">
                      {getSkillLevel(player, activeSkill)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                      {formatXP(getSkillXP(player, activeSkill))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Hiscores
