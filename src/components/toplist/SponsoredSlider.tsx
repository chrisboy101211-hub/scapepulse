import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

// Medieval/fantasy background themes for sponsors
const SPONSOR_BACKGROUNDS = [
  {
    gradient: "linear-gradient(135deg, rgba(30, 15, 60, 0.92) 0%, rgba(15, 10, 35, 0.95) 50%, rgba(45, 20, 80, 0.92) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 0 L100 50 L50 100 L0 50Z' fill='none' stroke='%239C92AC' stroke-width='0.5' opacity='0.1'/%3E%3C/svg%3E")`,
  },
  {
    gradient: "linear-gradient(135deg, rgba(20, 30, 50, 0.92) 0%, rgba(10, 15, 30, 0.95) 50%, rgba(30, 50, 70, 0.92) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='40' cy='40' r='30' fill='none' stroke='%239C92AC' stroke-width='0.5' opacity='0.08'/%3E%3Ccircle cx='40' cy='40' r='20' fill='none' stroke='%239C92AC' stroke-width='0.5' opacity='0.08'/%3E%3Ccircle cx='40' cy='40' r='10' fill='none' stroke='%239C92AC' stroke-width='0.5' opacity='0.08'/%3E%3C/svg%3E")`,
  },
  {
    gradient: "linear-gradient(135deg, rgba(50, 20, 30, 0.92) 0%, rgba(25, 10, 20, 0.95) 50%, rgba(70, 30, 40, 0.92) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='30' height='30' fill='%239C92AC' opacity='0.03'/%3E%3Crect x='30' y='30' width='30' height='30' fill='%239C92AC' opacity='0.03'/%3E%3C/svg%3E")`,
  },
  {
    gradient: "linear-gradient(135deg, rgba(15, 35, 25, 0.92) 0%, rgba(10, 25, 20, 0.95) 50%, rgba(25, 50, 35, 0.92) 100%)",
    pattern: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M25 0 L50 25 L25 50 L0 25Z' fill='none' stroke='%239C92AC' stroke-width='0.5' opacity='0.06'/%3E%3C/svg%3E")`,
  },
]

export function SponsoredSlider() {
  const [servers, setServers] = useState<ToplistServer[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    toplistDataService.getSponsoredServers()
      .then((servers) => {
        // Shuffle servers for randomness
        const shuffled = [...servers].sort(() => Math.random() - 0.5)
        setServers(shuffled)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (servers.length <= 1 || isPaused) return
    
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % servers.length)
    }, 8000)
    
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [servers.length, isPaused])

  const go = (index: number) => {
    setCurrent(index)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % servers.length)
    }, 8000)
  }

  if (loading) {
    return (
      <div className="w-full h-[420px] rounded-2xl bg-card border border-border animate-pulse mb-10" />
    )
  }

  if (servers.length === 0) return null

  const server = servers[current]
  const bgIndex = current % SPONSOR_BACKGROUNDS.length
  const currentBg = SPONSOR_BACKGROUNDS[bgIndex]

  const parseTags = (tags: string[] | string): string[] => {
    if (Array.isArray(tags)) return tags
    try { return JSON.parse(tags) } catch { return [] }
  }

  return (
    <div 
      className="mb-10 relative rounded-2xl overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background */}
      <div className="absolute inset-0">
        {/* Default medieval gradient background */}
        <div 
          className="absolute inset-0"
          style={{ background: currentBg.gradient }}
        />
        
        {/* Pattern overlay */}
        <div 
          className="absolute inset-0 opacity-100"
          style={{ backgroundImage: currentBg.pattern }}
        />
        
        {/* Server banner image if available */}
        {server.banner_url && (
          <img 
            src={server.banner_url} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: 0.25 }}
            onError={(e) => { 
              e.currentTarget.style.display = "none"
            }} 
          />
        )}
        
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-[420px] flex items-center">
        <div className="container mx-auto px-8 py-10 flex items-center gap-10">
          {/* Left Side - Content */}
          <div className="flex-1 max-w-2xl">
            {/* Sponsored Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-semibold mb-6">
              <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              ScapePulse Sponsored
            </div>

            {/* Server Logo */}
            <div className="mb-5">
              {server.image_url ? (
                <img 
                  src={server.image_url} 
                  alt={server.name} 
                  className="h-20 w-auto max-w-[280px] object-contain"
                  onError={(e) => { e.currentTarget.style.display = "none" }} 
                />
              ) : (
                <div className="h-20 w-48 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-xl flex items-center justify-center border border-purple-500/30">
                  <span className="text-3xl font-bold text-white">{server.name}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs px-2 py-1 rounded bg-purple-500/30 text-purple-300 border border-purple-500/40">{server.revision}</span>
              <span className="text-xs px-2 py-1 rounded bg-pink-500/30 text-pink-300 border border-pink-500/40">{server.server_type}</span>
              {server.experience_rate && (
                <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80 border border-white/20">{server.experience_rate} XP</span>
              )}
              {parseTags(server.tags).slice(0, 2).map((tag, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded bg-white/5 text-white/60 border border-white/10">{tag}</span>
              ))}
            </div>

            {/* Description */}
            <p className="text-white/80 text-sm mb-6 max-w-lg leading-relaxed">
              {server.short_description || server.description}
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <a 
                href={server.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg shadow-purple-500/30 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Play Now
              </a>

              {server.discord_invite && (
                <a 
                  href={server.discord_invite} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-lg shadow-lg shadow-[#5865F2]/30 transition-all"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Discord
                </a>
              )}
            </div>
          </div>

          {/* Right Side - Dots */}
          {servers.length > 1 && (
            <div className="flex flex-col items-center gap-3">
              {servers.map((_, i) => (
                <button 
                  key={i} 
                  onClick={() => go(i)} 
                  className={`rounded-full transition-all ${i === current ? "w-3 h-8 bg-gradient-to-r from-purple-500 to-pink-500" : "w-3 h-3 bg-white/20 hover:bg-white/40"}`} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {servers.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{ width: `${((current + 1) / servers.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
