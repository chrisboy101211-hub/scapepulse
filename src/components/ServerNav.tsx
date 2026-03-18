import { Link, useLocation } from "react-router-dom"
import { Loader2, ShoppingCart } from "lucide-react"

interface ServerNavProps {
  serverName: string
  serverSlug: string
  logoUrl?: string | null
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

  const navBg = bgColor ? `${bgColor}e6` : "rgba(15, 15, 15, 0.95)"

  return (
    <nav 
      className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl"
      style={{ backgroundColor: navBg }}
    >
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={serverName} 
                className="h-8 w-auto max-w-[120px] object-contain"
              />
            ) : (
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                >
                  {serverName.charAt(0).toUpperCase()}
                </div>
                <span className="font-display font-bold text-white">{serverName}</span>
              </div>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <Link 
            to={`/store/${serverSlug}`}
            className="transition-colors"
            style={{ color: isStore ? accentColor : "#9ca3af" }}
          >
            Store
          </Link>
          <Link 
            to={`/vote/${serverSlug}`}
            className="transition-colors"
            style={{ color: isVote ? accentColor : "#9ca3af" }}
          >
            Vote
          </Link>
          <Link 
            to={`/hiscores/${serverSlug}`}
            className="transition-colors"
            style={{ color: isHiscores ? accentColor : "#9ca3af" }}
          >
            Hiscores
          </Link>

          {showCart && (
            <button 
              onClick={onCartClick}
              className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10"
            >
              <ShoppingCart className="h-4 w-4" style={{ color: "#9ca3af" }} />
              <span className="text-gray-400">Cart</span>
              {cartCount > 0 && (
                <span 
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
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
