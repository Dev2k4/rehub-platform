import { OpenAPI } from "@/client"
import { refreshAccessTokenIfPossible } from "@/features/auth/utils/auth.refresh"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

export interface ChatConversationRead {
  id: string
  participant_a_id: string
  participant_b_id: string
  unread_count: number
  last_message_at?: string | null
  created_at: string
  updated_at: string
}

export interface ChatListingPreview {
  id: string
  title: string
  price: string | number
  image_url?: string | null
}

export interface ChatMessageRead {
  id: string
  conversation_id: string
  sender_id: string
  message_type: "text" | "listing_share"
  content?: string | null
  listing?: ChatListingPreview | null
  created_at: string
}

export interface ChatMessageHistoryRead {
  items: ChatMessageRead[]
  total: number
  page: number
  size: number
}

function getApiBase(): string {
  const base = OpenAPI.BASE.replace(/\/+$/, "")
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`
}

function getAuthHeaders(tokenOverride?: string | null): HeadersInit {
  const token = tokenOverride ?? getAccessToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function fetchWithAuthRetry(path: string, init: RequestInit): Promise<Response> {
  let response = await fetch(`${getApiBase()}${path}`, init)
  if (response.status === 401) {
    const refreshedToken = await refreshAccessTokenIfPossible()
    if (refreshedToken) {
      response = await fetch(`${getApiBase()}${path}`, {
        ...init,
        headers: getAuthHeaders(refreshedToken),
      })
    }
  }
  return response
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = "Request failed"
    try {
      const payload = await response.json()
      detail = payload?.detail ?? detail
    } catch {
      // ignore payload parse errors
    }
    throw new Error(detail)
  }
  return (await response.json()) as T
}

export async function createOrGetConversation(otherUserId: string): Promise<ChatConversationRead> {
  const response = await fetchWithAuthRetry(`/chat/conversations/${otherUserId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  return parseResponse<ChatConversationRead>(response)
}

export async function listMyConversations(): Promise<ChatConversationRead[]> {
  const response = await fetchWithAuthRetry(`/chat/conversations`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse<ChatConversationRead[]>(response)
}

export async function listConversationMessages(
  conversationId: string,
  params: { skip?: number; limit?: number } = {},
): Promise<ChatMessageHistoryRead> {
  const query = new URLSearchParams()
  if (typeof params.skip === "number") query.set("skip", String(params.skip))
  if (typeof params.limit === "number") query.set("limit", String(params.limit))
  const suffix = query.toString() ? `?${query.toString()}` : ""

  const response = await fetchWithAuthRetry(
    `/chat/conversations/${conversationId}/messages${suffix}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  )
  return parseResponse<ChatMessageHistoryRead>(response)
}

export async function sendChatMessage(
  conversationId: string,
  payload:
    | { message_type: "text"; content: string }
    | { message_type: "listing_share"; listing_id: string; content?: string },
): Promise<ChatMessageRead> {
  const response = await fetchWithAuthRetry(`/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse<ChatMessageRead>(response)
}

export async function markConversationRead(
  conversationId: string,
): Promise<{ ok: boolean }> {
  const response = await fetchWithAuthRetry(`/chat/conversations/${conversationId}/read`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  return parseResponse<{ ok: boolean }>(response)
}
