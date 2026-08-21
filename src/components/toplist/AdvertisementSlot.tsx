import { Link } from "react-router-dom"
import { CalendarClock, Megaphone } from "lucide-react"
import type { AdvertisementSlot as AdvertisementSlotType } from "@/lib/advertising"

type AdvertisementSlotProps = {
  slot: AdvertisementSlotType
  className?: string
  variant?: "standard" | "sponsored"
}

export function AdvertisementSlot({ slot, className = "", variant = "standard" }: AdvertisementSlotProps) {
  const available = slot.status === "available"
  const sponsored = variant === "sponsored"
  const hasBookedBanner = Boolean(slot.bannerUrl)

  return (
    <Link
      to="/advertising"
      aria-label={`${slot.name}: ${slot.availableOn}`}
      className={`group relative block overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5 ${
        available
          ? sponsored
            ? "border-violet-400/70 bg-violet-500/10 shadow-[0_0_24px_rgba(139,92,246,0.28)] hover:border-fuchsia-300 hover:shadow-[0_0_34px_rgba(168,85,247,0.48)]"
            : "border-primary/35 hover:border-primary/70 hover:shadow-[0_0_28px_hsl(var(--primary)/0.18)]"
          : "border-muted-foreground/30 opacity-75"
      } ${className}`}
    >
      <img
        src={slot.bannerUrl || "/images/ad-slot-placeholder-bg.png"}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${hasBookedBanner ? "opacity-100" : "opacity-65"}`}
      />
      <div className={`absolute inset-0 ${hasBookedBanner ? "bg-black/20" : sponsored ? "bg-gradient-to-r from-[#160d2c]/95 via-[#25134b]/80 to-fuchsia-500/25" : "bg-gradient-to-r from-background/95 via-background/75 to-primary/20"}`} />
      <div className={`relative flex h-full flex-col items-center justify-center px-4 text-center ${hasBookedBanner ? "opacity-0 transition-opacity group-hover:opacity-100" : ""}`}>
        <div className={`mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] ${sponsored ? "text-violet-200" : "text-primary"}`}>
          <Megaphone className="h-3 w-3" /> {sponsored ? "Sponsored placement" : "Advertisement"}
        </div>
        <span className="font-display text-base font-bold text-foreground sm:text-lg">{slot.serverName || "Your Server Here"}</span>
        <span className={`mt-1 inline-flex items-center gap-1 text-[10px] font-medium ${available ? "text-emerald-300" : "text-amber-300"}`}>
          <CalendarClock className="h-3 w-3" /> {slot.availableOn} · Monthly
        </span>
      </div>
    </Link>
  )
}
