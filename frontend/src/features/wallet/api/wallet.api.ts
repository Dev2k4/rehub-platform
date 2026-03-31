import { OpenAPI } from "@/client"
import { refreshAccessTokenIfPossible } from "@/features/auth/utils/auth.refresh"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

export interface WalletAccountRead {
  id: string
  user_id: string
  available_balance: string
  locked_balance: string
  created_at: string
  updated_at: string
}

export interface WalletTransactionRead {
  id: string
  user_id: string
  order_id: string | null
  type: string
  direction: string
  amount: string
  balance_after: string
  metadata: Record<string, unknown>
  created_at: string
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

export async function getMyWallet(): Promise<WalletAccountRead> {
  const response = await fetchWithAuthRetry(`/wallet/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse<WalletAccountRead>(response)
}

export async function demoTopupWallet(
  amount: number,
): Promise<WalletAccountRead> {
  const response = await fetchWithAuthRetry(`/wallet/demo-topup`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ amount }),
  })
  return parseResponse<WalletAccountRead>(response)
}

export async function getWalletTransactions(): Promise<
  WalletTransactionRead[]
> {
  const response = await fetchWithAuthRetry(`/wallet/transactions`, {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse<WalletTransactionRead[]>(response)
}
