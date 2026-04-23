import { OpenAPI } from "@/client"
import { refreshAccessTokenIfPossible } from "@/features/auth/utils/auth.refresh"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

export interface AssistantQueryRequest {
  message: string
  max_results?: number
}

export interface AssistantListingCandidate {
  id: string
  title: string
  price: string
  condition_grade: string
  status: string
  seller_id: string
  seller_name?: string | null
  province?: string | null
  district?: string | null
  trust_score: number
  rating_avg: number
  rating_count: number
  completed_orders: number
  image_url?: string | null
  match_reason?: string | null
}

export interface AssistantSellerInsight {
  user_id: string
  full_name: string
  trust_score: number
  rating_avg: number
  rating_count: number
  completed_orders: number
  review_summary: string[]
}

export interface AssistantQueryResponse {
  answer: string
  intent: string
  confidence: number
  listings: AssistantListingCandidate[]
  seller_insight?: AssistantSellerInsight | null
  follow_up_questions: string[]
}

export interface AssistantSuggestionsResponse {
  context: string
  suggestions: string[]
}

function getAuthHeaders(tokenOverride?: string | null): HeadersInit {
  const token = tokenOverride ?? getAccessToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function getApiBase(): string {
  const base = OpenAPI.BASE.replace(/\/+$/, "")
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = "Request failed"
    try {
      const payload = await response.json()
      detail = payload?.detail ?? detail
    } catch {
      // Keep fallback detail
    }
    throw new Error(detail)
  }
  return (await response.json()) as T
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

export async function queryAssistant(
  payload: AssistantQueryRequest,
): Promise<AssistantQueryResponse> {
  const response = await fetchWithAuthRetry(`/assistant/query`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse<AssistantQueryResponse>(response)
}

export async function getAssistantSuggestions(
  context = "general",
): Promise<AssistantSuggestionsResponse> {
  const response = await fetchWithAuthRetry(
    `/assistant/suggestions?context=${encodeURIComponent(context)}`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    },
  )
  return parseResponse<AssistantSuggestionsResponse>(response)
}
