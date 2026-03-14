import { useState, useEffect } from "react"
import { toplistDataService, type ToplistTickerMessage } from "@/lib/toplist-data"

export function Ticker() {
  const [messages, setMessages] = useState<ToplistTickerMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    toplistDataService.getTickerMessages()
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading || messages.length === 0) return null

  const allMessages = messages.sort((a, b) => b.priority - a.priority).map(m => m.message).join(" • ")

  return (
    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white py-3 overflow-hidden relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="ticker-scroll whitespace-nowrap inline-block">
              <span className="text-sm font-medium mr-8">{allMessages}</span>
              <span className="text-sm font-medium mr-8">{allMessages}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-blue-600 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-blue-600 to-transparent pointer-events-none" />
    </div>
  )
}
