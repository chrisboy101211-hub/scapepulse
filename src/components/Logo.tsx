export function Logo({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { text: "text-lg", svg: 14 },
    md: { text: "text-2xl", svg: 20 },
    lg: { text: "text-3xl", svg: 28 },
  }
  
  const { text, svg } = sizes[size]
  
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <span className={`font-bold ${text} text-blue-600 drop-shadow-sm`} style={{ textShadow: "0 1px 2px rgba(0,0,0,0.1)", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))" }}>
        SCAPE
      </span>
      <svg width={svg} height={svg * 0.6} viewBox="0 0 20 12" className="text-gray-500 mx-0.5">
        <path d="M0 6 L2 6 L3 2 L5 10 L7 6 L9 6 L11 2 L13 10 L15 6 L17 6 L20 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
      <span className={`font-bold ${text} text-purple-500`} style={{ textShadow: "0 0 8px rgba(168, 85, 247, 0.4), 0 1px 2px rgba(0,0,0,0.1)", filter: "drop-shadow(0 0 4px rgba(168, 85, 247, 0.3))" }}>
        PULSE
      </span>
    </div>
  )
}
