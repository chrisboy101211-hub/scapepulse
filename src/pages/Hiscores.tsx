import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { dataService } from "@/lib/data"
import { Logo } from "@/components/Logo"
import { Loader2, Search } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Server } from "@/lib/mock-data"

interface Skill {
  id: string; name: string; display_name: string; icon_url: string; ordinal: number; enabled: boolean;
}
interface Boss {
  id: string; name: string; display_name: string; icon_url: string; ordinal: number; enabled: boolean;
}
interface GameMode {
  id: string; name: string; display_name: string; is_default: boolean; enabled: boolean;
}

const getSubdomain = () => {
  const hostname = window.location.hostname
  if (hostname.includes("vercel.app") || hostname === "localhost") return null
  const parts = hostname.split(".")
  if (parts.length >= 2) {
    const mainDomain = parts.slice(-2).join(".")
    if (mainDomain === "scapepulse.com" && parts[0] !== "www" && parts[0] !== "scapepulse") return parts[0]
  }
  return null
}

const formatXP = (xp: number) => {
  if (xp >= 1_000_000_000) return (xp / 1_000_000_000).toFixed(2) + "B"
  if (xp >= 1_000_000) return (xp / 1_000_000).toFixed(2) + "M"
  if (xp >= 1_000) return (xp / 1_000).toFixed(1) + "K"
  return xp.toLocaleString()
}

const OVERALL_ICON = "https://oldschool.runescape.wiki/images/Overall_icon.png"

export default function Hiscores() {
  const paramsSlug = useParams()
  const [server, setServer] = useState<Server | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [bosses, setBosses] = useState<Boss[]>([])
  const [gameModes, setGameModes] = useState<GameMode[]>([])
  const [hiscores, setHiscores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [mainTab, setMainTab] = useState<"skills" | "bosses">("skills")
  const [activeSkill, setActiveSkill] = useState("overall")
  const [activeBoss, setActiveBoss] = useState("")
  const [activeGameMode, setActiveGameMode] = useState("ALL")

  const subdomain = getSubdomain()
  const slug = paramsSlug.slug || subdomain

  useEffect(() => { if (slug) loadInitialData() }, [slug])
  useEffect(() => { if (server) loadLeaderboard() }, [activeSkill, activeBoss, activeGameMode, mainTab, server])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const serverData = await dataService.getServerBySlug(slug || "")
      if (!serverData) return
      setServer(serverData)

      const [skillsData, gameModeData] = await Promise.all([
        dataService.getHiscoresSkills(serverData.id),
        dataService.getHiscoresGameModes(serverData.id),
      ])
      setSkills(skillsData)
      setGameModes(gameModeData)

      const { data: bossData } = await supabase
        .from("hiscores_bosses")
        .select("*")
        .eq("server_id", serverData.id)
        .eq("enabled", true)
        .order("ordinal")
      const bossArr = bossData || []
      setBosses(bossArr)
      if (bossArr.length > 0) setActiveBoss(bossArr[0].name)
    } finally {
      setLoading(false)
    }
  }

  const loadLeaderboard = async () => {
    if (!server) return
    setTableLoading(true)
    try {
      if (mainTab === "skills") {
        const gm = activeGameMode === "ALL" ? undefined : activeGameMode
        const data = await dataService.getHiscores(server.id, activeSkill, gm)
        setHiscores(data)
      } else if (mainTab === "bosses" && activeBoss) {
        const gm = activeGameMode === "ALL" ? undefined : activeGameMode
        const { data } = await supabase.rpc("get_boss_leaderboard", {
          p_server_id: server.id,
          p_boss_name: activeBoss,
          p_game_mode: gm ?? null,
          p_limit: 50,
        })
        setHiscores(data || [])
      }
    } finally {
      setTableLoading(false)
    }
  }

  const filtered = search
    ? hiscores.filter(p => p.username?.toLowerCase().includes(search.toLowerCase()))
    : hiscores

  const getSkillLevel = (player: any) => {
    if (activeSkill === "overall") return player.total_level?.toLocaleString() ?? "-"
    return player.skill_levels?.[activeSkill] ?? "-"
  }
  const getSkillXP = (player: any) => {
    if (activeSkill === "overall") return Number(player.total_xp ?? 0)
    return Number(player.skill_xp?.[activeSkill] ?? 0)
  }

  const displaySkills = [
    { name: "overall", display_name: "Overall", icon_url: OVERALL_ICON },
    ...skills,
  ]

  const activeSkillObj = displaySkills.find(s => s.name === activeSkill)
  const activeBossObj = bosses.find(b => b.name === activeBoss)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f]">
      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
    </div>
  )
  if (!server) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] text-white">
      <div className="text-center"><h1 className="text-2xl font-bold">Server not found</h1></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/"><Logo size="sm" /></Link>
            <span className="font-display font-bold text-white">{server.name}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to={`/store/${server.slug}`} className="text-gray-400 hover:text-white transition-colors">Store</Link>
            <Link to={`/hiscores/${server.slug}`} className="font-medium text-orange-400">Hiscores</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 via-amber-400 to-amber-500 bg-clip-text text-transparent">Hiscores</h1>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-800">
          <button
            onClick={() => setMainTab("skills")}
            className={`px-6 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              mainTab === "skills" ? "border-orange-500 text-orange-400" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Skills Hiscores
          </button>
          <button
            onClick={() => setMainTab("bosses")}
            className={`px-6 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
              mainTab === "bosses" ? "border-orange-500 text-orange-400" : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Boss Hiscores
          </button>
        </div>

        {/* Game mode filters */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[{ name: "ALL", display_name: "All" }, ...gameModes].map(gm => (
            <button
              key={gm.name}
              onClick={() => setActiveGameMode(gm.name)}
              className={`px-5 py-1.5 rounded text-sm font-semibold border transition-colors ${
                activeGameMode === gm.name
                  ? "bg-orange-500 border-orange-400 text-white"
                  : "bg-gray-900 border-gray-700 text-gray-300 hover:border-orange-500/60"
              }`}
            >
              {gm.display_name}
            </button>
          ))}
        </div>

        {/* Content layout - OblivionPK style */}
        <div className="flex gap-4">
          {/* Left sidebar - Skills/Bosses list */}
          <div className="w-44 flex-shrink-0">
            <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
              <div className="bg-orange-600/20 border-b border-orange-500/30 px-3 py-2">
                <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">
                  {mainTab === "skills" ? "Skills" : "Bosses"}
                </span>
              </div>
              <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                {mainTab === "skills" ? (
                  displaySkills.map(skill => (
                    <button
                      key={skill.name}
                      onClick={() => setActiveSkill(skill.name)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        activeSkill === skill.name
                          ? "bg-orange-500/20 text-orange-400"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <img
                        src={skill.icon_url}
                        alt={skill.display_name}
                        className="w-5 h-5 flex-shrink-0 object-contain"
                        onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                      <span>{skill.display_name}</span>
                    </button>
                  ))
                ) : (
                  bosses.map(boss => (
                    <button
                      key={boss.name}
                      onClick={() => setActiveBoss(boss.name)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                        activeBoss === boss.name
                          ? "bg-orange-500/20 text-orange-400"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      {boss.icon_url ? (
                        <img
                          src={boss.icon_url}
                          alt={boss.display_name}
                          className="w-5 h-5 flex-shrink-0 object-contain"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                      ) : (
                        <div className="w-5 h-5 flex-shrink-0 bg-gray-700 rounded" />
                      )}
                      <span className="truncate">{boss.display_name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right content - Leaderboard table */}
          <div className="flex-1 min-w-0">
            {/* Search bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search player..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
              <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded transition-colors">
                Search
              </button>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
              <div className="bg-orange-600/10 border-b border-orange-500/20 px-3 py-2 flex items-center gap-2">
                {mainTab === "skills" && activeSkillObj?.icon_url && (
                  <img src={activeSkillObj.icon_url} alt="" className="w-5 h-5 object-contain" />
                )}
                {mainTab === "bosses" && activeBossObj?.icon_url && (
                  <img src={activeBossObj.icon_url} alt="" className="w-5 h-5 object-contain" />
                )}
                <span className="text-orange-400 text-sm font-bold">
                  {mainTab === "skills" ? (activeSkillObj?.display_name ?? "Overall") : (activeBossObj?.display_name ?? "")} Hiscores
                </span>
                <span className="ml-auto text-gray-500 text-xs">{hiscores.length} players</span>
              </div>

              {tableLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                      <th className="text-left px-3 py-2 w-14">Rank</th>
                      <th className="text-left px-3 py-2">Username</th>
                      {mainTab === "skills" && <th className="text-right px-3 py-2 w-24">Total Level</th>}
                      <th className="text-right px-3 py-2 w-36">{mainTab === "skills" ? "XP" : "Kill Count"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={mainTab === "skills" ? 4 : 3} className="text-center py-12 text-gray-500">
                          No players found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((player, i) => {
                        const rank = i + 1
                        return (
                          <tr
                            key={player.id}
                            className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-3 py-2">
                              <span className="text-gray-500 font-mono">{rank}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="font-medium text-white">{player.username}</span>
                            </td>
                            {mainTab === "skills" && (
                              <td className="px-3 py-2 text-right font-mono text-gray-300">
                                {getSkillLevel(player)}
                              </td>
                            )}
                            <td className="px-3 py-2 text-right font-mono">
                              <span className="font-semibold text-orange-400">
                                {mainTab === "skills"
                                  ? formatXP(getSkillXP(player))
                                  : Number(player.kill_count ?? 0).toLocaleString()
                                }
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Compare link */}
            <div className="mt-3 text-right">
              <Link to={`/hiscores/${server.slug}/compare`} className="text-sm text-orange-400 hover:text-amber-300 hover:underline">
                Compare players →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
