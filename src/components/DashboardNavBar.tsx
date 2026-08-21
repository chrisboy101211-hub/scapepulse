import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"
import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth"
import { BarChart3 } from "lucide-react"

const DashboardNavBar = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [activePill, setActivePill] = useState("/toplist")
  const pillRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActivePill(location.pathname)
  }, [location.pathname])

  return (
    <nav className="sticky top-0 z-[100] h-16 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-full items-center justify-between px-6">
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
            href="https://discord.gg/cVhguuca3X" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-blue-500 hover:bg-blue-500/10 transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Discord
          </a>

          {/* StoreFront - Purple */}
          <Link
            to="/storefront"
            className="relative flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium text-purple-500 hover:bg-purple-500/10 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            StoreFront
            {activePill.startsWith("/storefront") && (
              <div
                ref={pillRef}
                className="absolute inset-0 rounded-full bg-purple-500/20 border border-purple-500/30 -z-10"
              />
            )}
          </Link>

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

          {/* Docs */}
          <Link
            to="/docs"
            className="relative px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Docs
            {activePill === "/docs" && (
              <div className="absolute inset-0 rounded-full bg-muted border border-border -z-10" />
            )}
          </Link>

          {/* Pricing */}
          <Link
            to="/pricing"
            className="relative px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            Pricing
            {activePill === "/pricing" && (
              <div className="absolute inset-0 rounded-full bg-muted border border-border -z-10" />
            )}
          </Link>
        </div>
        </div>

        {/* User info / Sign out */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {user?.email}
          </span>
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/"}>
            View Site
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default DashboardNavBar
