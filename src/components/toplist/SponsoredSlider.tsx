import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { toplistDataService, type ToplistServer } from "@/lib/toplist-data"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
    }, 6000)
    
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [servers.length, isPaused])

  const go = (index: number) => {
    setCurrent(index)
    if (timerRef.current) clearInterval(timerRef.current)
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
      <div className="w-full h-[400px] rounded-2xl bg-card border border-border animate-pulse mb-10" />
    )
  }

  if (servers.length === 0) return null

  const server = servers[current]

  return (
    <div 
      className="mb-10 relative rounded-2xl overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image */}
      {server.banner_url && (
        <div className="absolute inset-0">
          <img 
            src={server.banner_url} 
            alt="" 
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.style.display = "none" }} 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 min-h-[400px] flex items-center">
        <div className="container mx-auto px-6 py-12 flex items-center gap-8">
          {/* Left Side - Content */}
          <div className="flex-1 max-w-2xl">
            {/* Sponsored Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold mb-6">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              ScapePulse Sponsored
            </div>

            {/* Server Logo */}
            <div className="mb-4">
              {server.image_url ? (
                <img 
                  src={server.image_url} 
                  alt={server.name} 
                  className="h-16 w-auto max-w-[200px] object-contain"
                  onError={(e) => { e.currentTarget.style.display = "none" }} 
                />
              ) : (
                <div className="h-16 w-48 bg-white/10 rounded-lg flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">{server.name}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-white/90 text-sm mb-6 max-w-lg leading-relaxed">
              {server.short_description || server.description}
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <a 
                href={server.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg shadow-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Play Now
              </a>

              <Link 
                to={`/toplist/servers/${server.id}`}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600/80 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Learn More
              </Link>
            </div>
          </div>

          {/* Right Side - Navigation */}
          {servers.length > 1 && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button 
                  onClick={prev}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={next}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-1.5">
                {servers.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => go(i)} 
                    className={`rounded-full transition-all ${i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50"}`} 
                  />
                ))}
              </div>

              <button className="text-white/60 hover:text-white text-xs font-medium mt-2">
                Next Sponsor <ChevronRight className="w-3 h-3 inline" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {servers.length > 1 && !isPaused && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
            style={{ 
              width: `${((current + 1) / servers.length) * 100}%`,
              animation: "progress 6s linear infinite"
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
