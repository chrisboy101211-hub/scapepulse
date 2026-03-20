import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"

export function SponsoredSlider() {
  const [servers, setServers] = useState<ToplistServer[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    toplistDataService.getSponsoredServers()
      .then(setServers)
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

  const next = () => {
    if (servers.length <= 1) return
    go((current + 1) % servers.length)
  }

  const prev = () => {
    if (servers.length <= 1) return
    go((current - 1 + servers.length) % servers.length)
  }

  if (loading) {
    return (
      <div className="w-full h-[420px] rounded-2xl bg-card border border-border animate-pulse mb-10" />
    )
  }

  if (servers.length === 0) return null

  const server = servers[current]

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
      {/* Background with default medieval gradient */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: server.banner_url 
              ? `linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(15, 15, 15, 0.98) 50%, rgba(59, 7, 100, 0.95) 100%)`
              : `linear-gradient(135deg, rgba(88, 28, 135, 0.95) 0%, rgba(15, 15, 15, 0.98) 50%, rgba(59, 7, 100, 0.95) 100%)`,
          }}
        />
        {server.banner_url ? (
          <img 
            src={server.banner_url} 
            alt="" 
            className="w-full h-full object-cover opacity-40"
            onError={(e) => { 
              e.currentTarget.style.display = "none"
            }} 
          />
        ) : (
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-transparent to-[#0f0f0f]" />
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

              <Link 
                to={`/toplist/servers/${server.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Learn More
              </Link>
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

      {/* Navigation Arrows on sides */}
      {servers.length > 1 && (
        <>
          <button 
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all z-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button 
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all z-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </>
      )}

      {/* Progress Bar */}
      {servers.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ width: `${((current + 1) / servers.length) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
