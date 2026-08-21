export type AdvertisementSlot = {
  id: string
  name: string
  placement: "top-banner" | "sponsored" | "side-banner"
  cadence: "Monthly"
  status: "available" | "reserved"
  availableOn: string
  bannerUrl?: string
  serverName?: string
}

export const TOPLIST_PREMIUM_PRICE = 20
const MYTHOS_BANNER_URL = "/images/mythos-banner.png"

// This is the single source of truth for the toplist placeholders and the
// Advertisement page. Update this inventory when a placement is reserved.
export const advertisementSlots: AdvertisementSlot[] = [
  ...[1, 2, 3].map((position) => ({
    id: `top-banner-${position}`,
    name: `Top banner ${position}`,
    placement: "top-banner" as const,
    cadence: "Monthly" as const,
    status: "reserved" as const,
    availableOn: "Renews 1 Sep 2026",
    bannerUrl: MYTHOS_BANNER_URL,
    serverName: "Mythos - OSRS 50 Online !",
  })),
  ...[1, 2, 3, 4, 5].map((position) => ({
    id: `sponsored-${position}`,
    name: `Sponsored slot ${position}`,
    placement: "sponsored" as const,
    cadence: "Monthly" as const,
    status: position === 1 ? "reserved" as const : "available" as const,
    availableOn: position === 1 ? "Renews 1 Sep 2026" : "Available now",
    ...(position === 1 ? { bannerUrl: MYTHOS_BANNER_URL, serverName: "Mythos - OSRS 50 Online !" } : {}),
  })),
  ...[1, 2].flatMap((position) => [
    {
      id: `side-left-${position}`,
      name: `Left side banner ${position}`,
      placement: "side-banner" as const,
      cadence: "Monthly" as const,
      status: "available" as const,
      availableOn: "Available now",
    },
    {
      id: `side-right-${position}`,
      name: `Right side banner ${position}`,
      placement: "side-banner" as const,
      cadence: "Monthly" as const,
      status: "available" as const,
      availableOn: "Available now",
    },
  ]),
]

export function slotsForPlacement(placement: AdvertisementSlot["placement"]) {
  return advertisementSlots.filter((slot) => slot.placement === placement)
}
