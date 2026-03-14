import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import { Logo } from "@/components/Logo"

const NavBar = () => {
  return (
    <nav className="h-14 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-full items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" />
        </Link>
        
        <div className="flex items-center gap-6">
          <a 
            href="https://discord.gg/cVhguuca3X" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Discord
          </a>
          <Link 
            to="/docs" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <Link 
            to="/pricing" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link to="/login">
              Login
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <Link to="/register">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default NavBar
