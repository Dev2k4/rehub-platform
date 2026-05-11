import { OpenAPI } from "@/client"
import { refreshAccessTokenIfPossible } from "@/features/auth/utils/auth.refresh"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

export type EscrowStatus =
  | "awaiting_funding"
  | "held"
  | "release_pending"
  | "released"
  | "refunded"
  | "disputed"

export interface EscrowRead {
  id: string
  order_id: string
  buyer_id: string
  seller_id: string
  amount: string
  status: EscrowStatus
  funded_at: string | null
  released_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

interface EscrowAdminResolveRequest {
  result: "release" | "refund"
  note?: string
}

interface EscrowDisputeRequest {
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
      // Keep fallback detail
    }
    throw new Error(detail)
  }

  return (await response.json()) as T
}

async function fetchWithAuthRetry(
  path: string,
  init: RequestInit,
): Promise<Response> {
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

export async function getEscrow(orderId: string): Promise<EscrowRead> {
  const response = await fetchWithAuthRetry(`/escrows/${orderId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse<EscrowRead>(response)
}

export async function listDisputedEscrows(params?: {
  skip?: number
  limit?: number
}): Promise<EscrowRead[]> {
  const search = new URLSearchParams()
  if (typeof params?.skip === "number") {
    search.set("skip", String(params.skip))
  }
  if (typeof params?.limit === "number") {
    search.set("limit", String(params.limit))
  }

  const suffix = search.toString() ? `?${search.toString()}` : ""
  const response = await fetchWithAuthRetry(`/escrows/disputed${suffix}`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse<EscrowRead[]>(response)
}

export async function fundEscrow(orderId: string): Promise<EscrowRead> {
  const response = await fetchWithAuthRetry(`/escrows/${orderId}/fund`, {
    method: "POST",
    headers: getAuthHeaders(),
  })
  return parseResponse<EscrowRead>(response)
}

export async function requestEscrowRelease(
  orderId: string,
): Promise<EscrowRead> {
  const response = await fetchWithAuthRetry(
    `/escrows/${orderId}/release-request`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  )
  return parseResponse<EscrowRead>(response)
}

export async function confirmEscrowRelease(
  orderId: string,
): Promise<EscrowRead> {
  const response = await fetchWithAuthRetry(
    `/escrows/${orderId}/confirm-release`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    },
  )
  return parseResponse<EscrowRead>(response)
}

export async function openEscrowDispute(
  orderId: string,
  payload: EscrowDisputeRequest,
): Promise<EscrowRead> {
  const response = await fetchWithAuthRetry(
    `/escrows/${orderId}/open-dispute`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  )
  return parseResponse<EscrowRead>(response)
}

export async function resolveEscrowAsAdmin(
  orderId: string,
  payload: EscrowAdminResolveRequest,
): Promise<EscrowRead> {
  const response = await fetchWithAuthRetry(
    `/escrows/${orderId}/admin-resolve`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    },
  )
  return parseResponse<EscrowRead>(response)
}
