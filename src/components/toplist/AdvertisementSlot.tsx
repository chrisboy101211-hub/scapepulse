import { Link } from "react-router-dom"
import { CalendarClock, Megaphone } from "lucide-react"
import type { AdvertisementSlot as AdvertisementSlotType } from "@/lib/advertising"

type AdvertisementSlotProps = {
  slot: AdvertisementSlotType
  className?: string
  variant?: "standard" | "sponsored"
  orientation?: "horizontal" | "vertical"
}

export function AdvertisementSlot({ slot, className = "", variant = "standard", orientation = "horizontal" }: AdvertisementSlotProps) {
  const available = slot.status === "available"
  const sponsored = variant === "sponsored"
  const hasBookedBanner = Boolean(slot.bannerUrl)
  const vertical = orientation === "vertical"

  return (
    <Link
      to="/advertising"
      aria-label={`${slot.name}: ${slot.availableOn}`}
      className={`group relative block overflow-hidden border transition-all hover:-translate-y-0.5 ${
        available
          ? sponsored
            ? "border-violet-400/45 bg-violet-500/5 hover:border-violet-300/65"
            : "border-border/70 bg-card/50 hover:border-primary/40"
          : "border-muted-foreground/30 opacity-75"
      } ${className}`}
    >
      <img
        src={slot.bannerUrl || "/images/ad-slot-placeholder-bg.png"}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] ${hasBookedBanner ? "opacity-100" : vertical ? "opacity-10" : "opacity-25"}`}
      />
      <div className={`absolute inset-0 ${hasBookedBanner ? "bg-black/20" : sponsored ? "bg-gradient-to-r from-[#161125]/95 via-[#1b1528]/92 to-violet-950/70" : "bg-gradient-to-r from-background/95 via-card/92 to-background/80"}`} />
      {!hasBookedBanner && (
        <>
          <div className="absolute left-0 top-0 h-2 w-1/4 border-l border-t border-primary/30" />
          <div className="absolute right-0 bottom-0 h-2 w-1/4 border-b border-r border-primary/30" />
        </>
      )}
      <div className={`relative flex h-full items-center justify-center text-center ${vertical ? "flex-col gap-3 px-3 py-12" : "gap-3 px-4"} ${hasBookedBanner ? "flex-col opacity-0 transition-opacity group-hover:opacity-100" : ""}`}>
        {hasBookedBanner ? (
          <>
            <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${sponsored ? "text-violet-200" : "text-primary"}`}>
              <Megaphone className="h-3 w-3" /> {sponsored ? "Sponsored placement" : "Advertisement"}
            </div>
            <span className="font-display text-base font-bold text-foreground sm:text-lg">{slot.serverName}</span>
          </>
        ) : (
          vertical ? (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-background/80">
                <img src="/favicon.svg" alt="ScapePulse" className="h-6 w-6" />
              </span>
              <span className="space-y-1 text-center">
                <span className="block text-[9px] font-bold uppercase leading-tight tracking-[0.14em] text-primary">ScapePulse</span>
                <span className="block font-display text-sm font-bold leading-tight text-foreground">Your Server<br />Here</span>
              </span>
            </>
          ) : (
            <>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-background/70">
              <img src="/favicon.svg" alt="ScapePulse" className="h-6 w-6" />
              </span>
              <span className="min-w-0 text-left">
                <span className={`block text-[9px] font-bold uppercase tracking-[0.18em] ${sponsored ? "text-violet-200" : "text-primary"}`}>ScapePulse advertisement</span>
                <span className="block truncate font-display text-sm font-bold text-foreground sm:text-base">Your Server Here</span>
              </span>
              <span className="hidden rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-primary sm:inline">Reserve spot</span>
            </>
          )
        )}
        <span className={`absolute bottom-2 inline-flex items-center gap-1 text-[9px] font-medium ${vertical ? "left-0 right-0 justify-center" : "right-2"} ${available ? "text-emerald-300" : "text-amber-300"}`}>
          <CalendarClock className="h-2.5 w-2.5" /> {slot.availableOn}
        </span>
      </div>
    </Link>
  )
}
