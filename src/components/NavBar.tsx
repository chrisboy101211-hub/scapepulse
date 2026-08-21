import { Link, useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { ChevronDown, Crown, Megaphone, MessageCircle, Trophy } from "lucide-react"
import { AuthDropdown } from "@/components/AuthDropdown"
import { LatestServersTicker } from "@/components/LatestServersTicker"
import { toplistDataService } from "@/lib/toplist-data"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NavBar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [activePill, setActivePill] = useState("/toplist")
  const [hasToplistServer, setHasToplistServer] = useState<boolean | null>(null)

  useEffect(() => {
    setActivePill(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    let mounted = true

    if (!user) {
      setHasToplistServer(null)
      return () => { mounted = false }
    }

    setHasToplistServer(null)
    toplistDataService.getUserServer(user.id)
      .then((server) => {
        if (mounted) setHasToplistServer(Boolean(server))
      })
      .catch(() => {
        if (mounted) setHasToplistServer(false)
      })

    return () => { mounted = false }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate("/")
  }

  return (
    <nav className="sticky top-0 z-[100] border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
        </Link>
        
        {/* Pill Navigation */}
        <div className="hidden md:flex items-center gap-2">
          {/* Home icon — outside the pill, links to main page */}
          <Link
            to="/"
            className="electric-border flex items-center justify-center w-9 h-9 rounded-full bg-muted/50 transition-all"
            title="Home"
          >
            <img src="/favicon.svg" alt="Home" className="w-5 h-5" />
          </Link>

        <div className="flex items-center gap-1 p-1 rounded-full bg-muted/50 border border-border/50">
          {/* Discord - Blue */}
          <a 
            href="https://discord.gg/h2h8RSa2sr"
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-blue-500 hover:bg-blue-500/10 transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            Discord
          </a>

          {/* Video Hub - Red */}
          <Link
            to="/video-hub"
            className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
            </svg>
            Video Hub
            {activePill.startsWith("/video-hub") && (
              <div className="absolute inset-0 rounded-full bg-red-500/20 border border-red-500/30 -z-10" />
            )}
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger className={`relative flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all outline-none ${activePill === "/pricing" || activePill === "/advertising" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
              Advertisement <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="z-[110] w-60 rounded-xl border-border/70 bg-card p-1.5">
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0 focus:bg-muted">
                <Link to="/advertising" className="flex w-full items-start gap-3 px-3 py-2.5">
                  <Crown className="mt-0.5 h-4 w-4 text-violet-300" />
                  <span><span className="block font-medium">Toplist Premium & spots</span><span className="block text-xs text-muted-foreground">Premium glow and banner availability</span></span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-0 focus:bg-muted">
                <Link to="/pricing" className="flex w-full items-start gap-3 px-3 py-2.5">
                  <Megaphone className="mt-0.5 h-4 w-4 text-primary" />
                  <span><span className="block font-medium">Storefronts pricing</span><span className="block text-xs text-muted-foreground">Plans and fees for storefronts</span></span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {hasToplistServer !== null && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={hasToplistServer ? "/dashboard/toplist" : "/toplist/submit"}>
                    <Trophy className="mr-1.5 h-3.5 w-3.5" />
                    {hasToplistServer ? "Manage Server" : "Post Server"}
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link to="/profile">Profile</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="hero" size="sm" onClick={handleSignOut}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <AuthDropdown
                defaultView="login"
                trigger={
                  <Button variant="outline" size="sm">Login</Button>
                }
              />
              <AuthDropdown
                defaultView="register"
                trigger={
                  <Button variant="hero" size="sm" className="bg-violet-600 text-white hover:bg-violet-500">Get Started</Button>
                }
              />
            </>
          )}
        </div>
      </div>
      <LatestServersTicker />
    </nav>
  )
}

export default NavBar
