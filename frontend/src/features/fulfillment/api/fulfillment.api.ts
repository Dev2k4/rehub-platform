import { OpenAPI } from "@/client"
import { refreshAccessTokenIfPossible } from "@/features/auth/utils/auth.refresh"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

export type FulfillmentStatus =
  | "pending_seller_start"
  | "preparing"
  | "in_delivery"
  | "delivered_by_seller"
  | "buyer_confirmed_received"

export interface FulfillmentRead {
  id: string
  order_id: string
  buyer_id: string
  seller_id: string
  status: FulfillmentStatus
  created_at: string
  updated_at: string
}

interface MarkDeliveredPayload {
  proof_image_urls: string[]
  note?: string
}

interface BuyerConfirmPayload {
  proof_image_urls: string[]
  note?: string
}

interface MarkShippingPayload {
  note?: string
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
      // Keep fallback detail.
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

export async function getFulfillment(orderId: string): Promise<FulfillmentRead> {
  const response = await fetchWithAuthRetry(`/fulfillments/${orderId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse<FulfillmentRead>(response)
}

export async function startPreparing(orderId: string): Promise<FulfillmentRead> {
  const response = await fetchWithAuthRetry(`/fulfillments/${orderId}/start-preparing`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  return parseResponse<FulfillmentRead>(response)
}

export async function markShipping(
  orderId: string,
  payload: MarkShippingPayload,
): Promise<FulfillmentRead> {
  const response = await fetchWithAuthRetry(`/fulfillments/${orderId}/mark-shipping`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse<FulfillmentRead>(response)
}

export async function markDelivered(
  orderId: string,
  payload: MarkDeliveredPayload,
): Promise<FulfillmentRead> {
  const response = await fetchWithAuthRetry(`/fulfillments/${orderId}/mark-delivered`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse<FulfillmentRead>(response)
}

export async function buyerConfirmReceived(
  orderId: string,
  payload: BuyerConfirmPayload,
): Promise<FulfillmentRead> {
  const response = await fetchWithAuthRetry(`/fulfillments/${orderId}/buyer-confirm`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
  return parseResponse<FulfillmentRead>(response)
}
