import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { getAccessToken } from "@/features/auth/utils/auth.storage"
import { wsClient } from "./ws.client"

type WsContextValue = {
  connected: boolean
  onlineUserIds: string[]
}

const WsContext = createContext<WsContextValue>({
  connected: false,
  onlineUserIds: [],
})

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false)
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])

  useEffect(() => {
    const token = getAccessToken()
    if (token) {
      wsClient.connect(token)
    }

    const offOpen = wsClient.on("ws:open", () => setConnected(true))
    const offClose = wsClient.on("ws:close", () => {
      setConnected(false)
      setOnlineUserIds([])
    })

    const offConnectedData = wsClient.on("ws:connected", (payload) => {
      const data = payload as { online_user_ids?: unknown }
      const ids = Array.isArray(data.online_user_ids)
        ? data.online_user_ids.filter(
            (value): value is string => typeof value === "string",
          )
        : []
      setOnlineUserIds(ids)
    })

    const offUserOnline = wsClient.on("user:online", (payload) => {
      const data = payload as { user_id?: unknown }
      if (typeof data.user_id !== "string") {
        return
      }

      setOnlineUserIds((prev) =>
        prev.includes(data.user_id as string)
          ? prev
          : [...prev, data.user_id as string],
      )
    })

    const offUserOffline = wsClient.on("user:offline", (payload) => {
      const data = payload as { user_id?: unknown }
      if (typeof data.user_id !== "string") {
        return
      }

      setOnlineUserIds((prev) => prev.filter((id) => id !== data.user_id))
    })

    const onTokenChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ token: string | null }>
      const nextToken = customEvent.detail.token

      if (!nextToken) {
        wsClient.disconnect()
        setConnected(false)
        return
      }

      wsClient.disconnect()
      wsClient.connect(nextToken)
    }

    window.addEventListener("auth:token-changed", onTokenChanged)

    return () => {
      offOpen()
      offClose()
      offConnectedData()
      offUserOnline()
      offUserOffline()
      window.removeEventListener("auth:token-changed", onTokenChanged)
      wsClient.disconnect()
    }
  }, [])

  const value = useMemo(
    () => ({
      connected,
      onlineUserIds,
    }),
    [connected, onlineUserIds],
  )

  useEffect(() => {
    if (!connected) {
      return
    }

    const timer = window.setInterval(() => {
      wsClient.send({ type: "ws:ping" })
    }, 30_000)

    return () => {
      window.clearInterval(timer)
    }
  }, [connected])

  return <WsContext.Provider value={value}>{children}</WsContext.Provider>
}

export function useWebSocketStatus() {
  return useContext(WsContext)
}

export function useIsUserOnline(userId?: string | null) {
  const { onlineUserIds } = useWebSocketStatus()
  if (!userId) {
    return false
  }
  return onlineUserIds.includes(userId)
}
