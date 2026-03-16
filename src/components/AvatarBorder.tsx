import { type BorderEffect } from "@/lib/profile-data"

interface AvatarBorderProps {
  avatarUrl: string | null
  displayName: string
  borderEffect: BorderEffect | string
  profileColor?: string
  size?: number  // px
  className?: string
}

export function AvatarBorder({ avatarUrl, displayName, borderEffect, profileColor = '#00ffff', size = 80, className = '' }: AvatarBorderProps) {
  const borderClass = borderEffect === 'none' ? 'avatar-border-none'
    : borderEffect === 'solid' ? 'avatar-border-solid'
    : borderEffect === 'glow' ? 'avatar-border-glow'
    : `avatar-border-${borderEffect}`

  const initial = (displayName || '?').charAt(0).toUpperCase()

  return (
    <div
      className={`${borderClass} flex-shrink-0 ${className}`}
      style={{ '--profile-color': profileColor, width: size + 6, height: size + 6 } as React.CSSProperties}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          style={{ width: size, height: size }}
          className="rounded-full object-cover block"
        />
      ) : (
        <div
          style={{ width: size, height: size, backgroundColor: profileColor + '33', color: profileColor }}
          className="rounded-full flex items-center justify-center font-bold text-xl"
        >
          {initial}
        </div>
      )}
    </div>
  )
}
