import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { dataService } from "@/lib/data"
import { useAuth } from "@/lib/auth"
import type { Server } from "@/lib/mock-data"

type ServerContextType = {
  servers: Server[]
  selectedServer: Server | null
  setSelectedServer: (server: Server | null) => void
  loading: boolean
}

const ServerContext = createContext<ServerContextType>({
  servers: [],
  selectedServer: null,
  setSelectedServer: () => {},
  loading: true,
})

export const useServers = () => useContext(ServerContext)

export function ServerProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [servers, setServers] = useState<Server[]>([])
  const [selectedServer, setSelectedServer] = useState<Server | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user) {
      dataService.getServers(user.id).then(data => {
        setServers(data)
        setLoading(false)
      })
    } else if (!authLoading && !user) {
      setServers([])
      setLoading(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    if (servers.length > 0 && !selectedServer) {
      setSelectedServer(servers[0])
    } else if (servers.length === 0) {
      setSelectedServer(null)
    }
  }, [servers])

  return (
    <ServerContext.Provider value={{ servers, selectedServer, setSelectedServer, loading }}>
      {children}
    </ServerContext.Provider>
  )
}
