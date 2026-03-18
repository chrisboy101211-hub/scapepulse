import { Link, useLocation } from "react-router-dom"
import { Logo } from "@/components/Logo"

interface ServerNavProps {
  serverName: string
  serverSlug: string
  logoUrl?: string | null
  isPremium?: boolean
  accentColor: string
  bgColor?: string | null
  showCart?: boolean
  cartCount?: number
  onCartClick?: () => void
}

export function ServerNav({
  serverName,
  serverSlug,
  logoUrl,
  isPremium = false,
  accentColor,
  bgColor,
  showCart = false,
  cartCount = 0,
  onCartClick,
}: ServerNavProps) {
  const location = useLocation()
  
  const isStore = location.pathname.includes(`/store/`) || location.pathname === `/store/${serverSlug}`
  const isHiscores = location.pathname.includes(`/hiscores/`) || location.pathname === `/hiscores/${serverSlug}`
  const isVote = location.pathname.includes(`/vote/`) || location.pathname === `/vote/${serverSlug}`

  const navBg = bgColor ? `${bgColor}ee` : "rgba(15, 15, 15, 0.95)"

  return (
    <nav 
      className="h-16 border-b border-white/10 backdrop-blur-sm"
      style={{ backgroundColor: navBg }}
    >
      <div className="container mx-auto flex h-full items-center justify-between px-6">
        {/* Left - Main Logo + Mini Home Icon */}
        <div className="flex items-center gap-3">
          {/* Main Logo - Server logo if premium, otherwise ScapePulse logo */}
          <Link to="/" className="flex items-center">
            {logoUrl && isPremium ? (
              <img 
                src={logoUrl} 
                alt={serverName} 
                className="h-8 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <Logo size="sm" />
            )}
          </Link>

          {/* Mini Home Icon - links to main ScapePulse page */}
          <Link
            to="/"
            className="electric-border flex items-center justify-center w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 transition-all"
            title="Home"
          >
            <img src="/favicon.svg" alt="Home" className="w-5 h-5" />
          </Link>
        </div>

        {/* Center - Pill Navigation */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          {/* Store */}
          <Link
            to={`/store/${serverSlug}`}
            className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:text-white"
            style={{ color: isStore ? accentColor : "#9ca3af" }}
          >
            Store
            {isStore && (
              <div 
                className="absolute inset-0 rounded-full -z-10 pointer-events-none"
                style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}50` }}
              />
            )}
          </Link>

          {/* Vote */}
          <Link
            to={`/vote/${serverSlug}`}
            className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:text-white"
            style={{ color: isVote ? accentColor : "#9ca3af" }}
          >
            Vote
            {isVote && (
              <div 
                className="absolute inset-0 rounded-full -z-10 pointer-events-none"
                style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}50` }}
              />
            )}
          </Link>

          {/* Hiscores */}
          <Link
            to={`/hiscores/${serverSlug}`}
            className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all hover:text-white"
            style={{ color: isHiscores ? accentColor : "#9ca3af" }}
          >
            Hiscores
            {isHiscores && (
              <div 
                className="absolute inset-0 rounded-full -z-10 pointer-events-none"
                style={{ backgroundColor: `${accentColor}20`, border: `1px solid ${accentColor}50` }}
              />
            )}
          </Link>
        </div>

        {/* Right - Cart */}
        <div className="flex items-center">
          {showCart && (
            <button 
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:bg-white/10"
              style={{ color: "#9ca3af" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Cart
              {cartCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
