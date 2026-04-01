import { getAccessToken } from "@/features/auth/utils/auth.storage"

type WsHandler = (payload: unknown) => void

type WsMessage = {
  type: string
  data?: unknown
}

class WsClient {
  private socket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private manualDisconnect = false
  private blockedByAuth = false
  private reconnectAttempt = 0
  private readonly listeners = new Map<string, Set<WsHandler>>()

  connect(explicitToken?: string) {
    const token = explicitToken || getAccessToken()
    if (!token) {
      return
    }

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    this.manualDisconnect = false
    this.blockedByAuth = false
    const baseUrl = import.meta.env.VITE_API_URL || "http://10.0.0.47:8000"
    const wsUrl = this.toWebSocketUrl(baseUrl, token)
    this.socket = new WebSocket(wsUrl)

    this.socket.onopen = () => {
      this.reconnectAttempt = 0
      this.emitLocal("ws:open", { connected: true })
    }

    this.socket.onmessage = (event) => {
      const parsed = this.parseMessage(event.data)
      if (!parsed) {
        return
      }

      this.emitLocal(parsed.type, parsed.data)
    }

    this.socket.onerror = () => {
      this.emitLocal("ws:error", { connected: false })
    }

    this.socket.onclose = (event) => {
      this.emitLocal("ws:close", {
        connected: false,
        code: event.code,
        reason: event.reason,
      })
      this.socket = null
      if (event.code === 1008) {
        this.blockedByAuth = true
      }
      if (!this.manualDisconnect) {
        this.scheduleReconnect()
      }
    }
  }

  disconnect() {
    this.manualDisconnect = true
    if (this.reconnectTimer) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.socket?.close()
    this.socket = null
    this.blockedByAuth = false
  }

  send(message: WsMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }
    this.socket.send(JSON.stringify(message))
  }

  on(eventName: string, handler: WsHandler) {
    const current = this.listeners.get(eventName) || new Set<WsHandler>()
    current.add(handler)
    this.listeners.set(eventName, current)

    return () => {
      const handlers = this.listeners.get(eventName)
      if (!handlers) {
        return
      }
      handlers.delete(handler)
      if (handlers.size === 0) {
        this.listeners.delete(eventName)
      }
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return
    }

    if (this.blockedByAuth) {
      return
    }

    if (!getAccessToken()) {
      return
    }

    const delay = Math.min(1000 * 2 ** this.reconnectAttempt, 15000)
    this.reconnectAttempt += 1
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private emitLocal(eventName: string, payload: unknown) {
    const handlers = this.listeners.get(eventName)
    if (!handlers) {
      return
    }

    for (const handler of handlers) {
      handler(payload)
    }
  }

  private parseMessage(raw: string): WsMessage | null {
    try {
      const parsed = JSON.parse(raw) as WsMessage
      if (!parsed.type) {
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  private toWebSocketUrl(baseUrl: string, token: string): string {
    const url = new URL(baseUrl)
    const protocol = url.protocol === "https:" ? "wss:" : "ws:"
    const wsBase = `${protocol}//${url.host}`
    return `${wsBase}/api/v1/ws?token=${encodeURIComponent(token)}`
  }
}

export const wsClient = new WsClient()