import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { dataService } from "@/lib/data"
import { Logo } from "@/components/Logo"
import { Loader2, Search, Skull } from "lucide-react"
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

const OVERALL_ICON = "https://oldschool.runescape.wiki/images/Stats_icon.png"

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "")
  const r = parseInt(clean.slice(0, 2), 16) || 0
  const g = parseInt(clean.slice(2, 4), 16) || 0
  const b = parseInt(clean.slice(4, 6), 16) || 0
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// XP mode badge colors
const XP_MODE_COLORS: Record<string, string> = {
  NORMAL: "bg-gray-700 text-gray-300",
  "5X": "bg-blue-900/60 text-blue-300",
  "10X": "bg-green-900/60 text-green-300",
  "50X": "bg-purple-900/60 text-purple-300",
  "100X": "bg-red-900/60 text-red-300",
}

// Game mode icons
const GAME_MODE_ICONS: Record<string, string> = {
  IRONMAN: "⚔️",
  ULTIMATE_IRONMAN: "💀",
  HCIM: "❤️",
  HARDCORE_IRONMAN: "❤️",
}

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

      // Load boss list
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

  const accent = (server as any)?.theme_hiscores_accent ?? "#f59e0b"
  const pageBg = (server as any)?.theme_hiscores_bg ?? "#0f0f0f"

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0f0f0f" }}>
      <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#f59e0b" }} />
    </div>
  )
  if (!server) return (
    <div className="min-h-screen flex items-center justify-center text-white" style={{ backgroundColor: "#0f0f0f" }}>
      <div className="text-center"><h1 className="text-2xl font-bold">Server not found</h1></div>
    </div>
  )

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: pageBg }}>
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl" style={{ backgroundColor: pageBg + "f2" }}>
        <div className="container mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link to="/"><Logo size="sm" /></Link>
            <span className="font-display font-bold text-white">{server.name}</span>
            <span className="rounded px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: hexToRgba(accent, 0.2), color: accent }}>HISCORES</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to={`/store/${server.slug}`} className="text-gray-400 hover:text-white transition-colors">Store</Link>
            <Link to={`/hiscores/${server.slug}`} className="font-medium" style={{ color: accent }}>Hiscores</Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-white mb-1">{server.name}</h1>
          <p className="font-semibold text-lg tracking-wide uppercase" style={{ color: accent }}>Hiscores</p>
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/10">
          {(["skills", "bosses"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`px-6 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px ${
                mainTab === tab
                  ? "border-transparent"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
              style={mainTab === tab ? { borderBottomColor: accent, color: accent } : {}}
            >
              {tab === "skills" ? "Skills Hiscores" : "Boss Hiscores"}
            </button>
          ))}
        </div>

        {/* Game mode filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[{ name: "ALL", display_name: "All" }, ...gameModes].map(gm => (
            <button
              key={gm.name}
              onClick={() => setActiveGameMode(gm.name)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                activeGameMode === gm.name
                  ? "text-black"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30"
              }`}
              style={activeGameMode === gm.name ? { backgroundColor: accent, borderColor: accent } : {}}
            >
              {GAME_MODE_ICONS[gm.name] ? `${GAME_MODE_ICONS[gm.name]} ` : ""}{gm.display_name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* Left: skill/boss grid */}
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 bg-white/5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {mainTab === "skills" ? "Select Skill" : "Select Boss"}
              </p>
            </div>
            <div className="p-3 grid grid-cols-4 gap-1.5 max-h-[520px] overflow-y-auto">
              {mainTab === "skills"
                ? displaySkills.map(skill => (
                    <button
                      key={skill.name}
                      onClick={() => setActiveSkill(skill.name)}
                      title={skill.display_name}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all border ${
                        activeSkill === skill.name ? "" : "border-transparent hover:bg-white/10"
                      }`}
                      style={activeSkill === skill.name ? { backgroundColor: hexToRgba(accent, 0.2), borderColor: hexToRgba(accent, 0.5) } : {}}
                    >
                      {skill.icon_url
                        ? <img src={skill.icon_url} alt={skill.display_name} className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                        : <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold" style={{ backgroundColor: hexToRgba(accent, 0.2), color: accent }}>{skill.display_name[0]}</div>
                      }
                      <span className="text-[10px] text-gray-400 text-center leading-tight truncate w-full">{skill.display_name}</span>
                    </button>
                  ))
                : bosses.map(boss => (
                    <button
                      key={boss.name}
                      onClick={() => setActiveBoss(boss.name)}
                      title={boss.display_name}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all border ${
                        activeBoss === boss.name ? "" : "border-transparent hover:bg-white/10"
                      }`}
                      style={activeBoss === boss.name ? { backgroundColor: hexToRgba(accent, 0.2), borderColor: hexToRgba(accent, 0.5) } : {}}
                    >
                      {boss.icon_url
                        ? <img src={boss.icon_url} alt={boss.display_name} className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).src = "" }} />
                        : <Skull className="w-6 h-6" style={{ color: accent }} />
                      }
                      <span className="text-[10px] text-gray-400 text-center leading-tight truncate w-full">{boss.display_name}</span>
                    </button>
                  ))
              }
            </div>
          </div>

          {/* Right: leaderboard */}
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            {/* Table header bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                {mainTab === "skills" && activeSkillObj?.icon_url && (
                  <img src={activeSkillObj.icon_url} alt="" className="w-5 h-5 object-contain" />
                )}
                {mainTab === "bosses" && activeBossObj?.icon_url && (
                  <img src={activeBossObj.icon_url} alt="" className="w-5 h-5 object-contain" />
                )}
                <span className="font-semibold text-sm">
                  {mainTab === "skills" ? activeSkillObj?.display_name ?? "Overall" : activeBossObj?.display_name ?? ""}
                </span>
                <span className="text-xs text-gray-500">Leaderboard</span>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search player..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 w-48"
                />
              </div>
            </div>

            {tableLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: accent }} />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left w-14">Rank</th>
                    <th className="px-4 py-3 text-left">Username</th>
                    {mainTab === "skills" && <th className="px-4 py-3 text-right">Total Level</th>}
                    <th className="px-4 py-3 text-right">{mainTab === "skills" ? "XP" : "Kill Count"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={mainTab === "skills" ? 4 : 3} className="px-4 py-16 text-center text-gray-500">
                        No players found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((player, i) => {
                      const rank = i + 1
                      const xpModeKey = (player.xp_mode ?? "NORMAL").toUpperCase()
                      const xpModeBadgeColor = XP_MODE_COLORS[xpModeKey] ?? "bg-gray-700 text-gray-300"
                      const xpModeLabel = player.xp_mode && player.xp_mode !== "NORMAL"
                        ? player.xp_mode.replace("_", "") : null
                      const gameModeIcon = GAME_MODE_ICONS[player.game_mode?.toUpperCase()] ?? ""

                      return (
                        <tr
                          key={player.id}
                          className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                            rank === 1 ? "bg-yellow-500/5" :
                            rank === 2 ? "bg-gray-400/5" :
                            rank === 3 ? "bg-amber-700/5" : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            {rank <= 3 ? (
                              <span className={`text-lg ${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-gray-300" : "text-amber-600"}`}>
                                {rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉"}
                              </span>
                            ) : (
                              <span className="text-gray-500 font-mono">{rank}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {gameModeIcon && <span title={player.game_mode}>{gameModeIcon}</span>}
                              <span className="font-medium text-white">{player.username}</span>
                              {xpModeLabel && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${xpModeBadgeColor}`}>
                                  {xpModeLabel}
                                </span>
                              )}
                            </div>
                          </td>
                          {mainTab === "skills" && (
                            <td className="px-4 py-3 text-right font-mono text-gray-300">
                              {getSkillLevel(player)}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right font-mono">
                            <span className="font-semibold" style={{ color: accent }}>
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
        </div>
      </div>
    </div>
  )
}
