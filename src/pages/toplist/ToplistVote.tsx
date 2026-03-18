import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ServerNav } from "@/components/ServerNav"
import { dataService } from "@/lib/data"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"
import { Loader2 } from "lucide-react"

export default function ToplistVote() {
  const { id } = useParams<{ id: string }>()
  const [server, setServer] = useState<ToplistServer | null>(null)
  const [loading, setLoading] = useState(true)
  const [accentColor, setAccentColor] = useState("#a855f7")
  const [bgColor, setBgColor] = useState("#0f0f0f")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [pillLogoUrl, setPillLogoUrl] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)

  useEffect(() => {
    if (!id) return
    toplistDataService.getServer(Number(id))
      .then(async (serverData) => {
        setServer(serverData)
        if (serverData) {
          setIsPremium(serverData.is_premium)
          const themeData = await dataService.getServerTheme(serverData.id.toString())
          if (themeData) {
            setAccentColor(themeData.theme_vote_accent || "#a855f7")
            setBgColor(themeData.theme_vote_bg || "#0f0f0f")
            setLogoUrl(themeData.logo_url || null)
            setPillLogoUrl(themeData.pill_logo_url || null)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleVote = () => {
    if (!server) return
    const voteTarget = server.vote_link || server.website
    window.open(voteTarget, "_blank", "noopener,noreferrer")
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-12 w-12 animate-spin" style={{ color: accentColor }} />
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
        <div className="container mx-auto px-6 py-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Server Not Found</h2>
          <Link to="/toplist" className="hover:underline" style={{ color: accentColor }}>
            Back to Toplist
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor }}>
      <ServerNav
        serverName={server.name}
        serverSlug=""
        logoUrl={logoUrl}
        pillLogoUrl={pillLogoUrl}
        isPremium={isPremium}
        accentColor={accentColor}
        bgColor={bgColor}
      />
      <div className="container mx-auto px-6 py-16 max-w-lg">
        <div className="bg-gray-900/80 border border-white/10 rounded-2xl p-8 shadow-xl">
          {/* Server Info */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-800 border border-white/10 flex-shrink-0">
              {server.image_url ? (
                <img src={server.image_url} alt={server.name} className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = "none" }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: accentColor }}>{server.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{server.name}</h1>
              <p className="text-gray-400">{server.votes.toLocaleString()} total votes</p>
            </div>
          </div>

          <p className="text-gray-400 mb-8 text-center">
            Clicking Vote Now will take you to the vote page. Your vote will be confirmed automatically once complete.
          </p>

          <button
            onClick={handleVote}
            className="w-full py-4 text-lg font-bold text-white rounded-xl shadow-lg transition-all"
            style={{ backgroundColor: accentColor }}
          >
            🗳️ Vote Now
          </button>

          <p className="mt-4 text-xs text-gray-500 text-center">
            You can vote once every 12 hours. In-game rewards are granted automatically after your vote is confirmed.
          </p>

          <div className="mt-6 flex items-center justify-between text-sm text-gray-400">
            <a href={server.website} target="_blank" rel="noopener noreferrer"
              className="hover:text-white transition-colors" style={{ color: accentColor }}>
              Visit {server.name}
            </a>
            <Link to={`/toplist/servers/${server.id}`} className="hover:text-white transition-colors" style={{ color: accentColor }}>
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
