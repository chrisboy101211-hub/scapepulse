import { Logo } from "@/components/Logo"

export function ToplistFooter() {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} ScapePulse. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
