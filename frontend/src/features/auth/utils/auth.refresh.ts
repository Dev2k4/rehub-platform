import { OpenAPI } from "@/client"
import {
  clearTokens,
  getRefreshToken,
  isRememberMeEnabled,
  setTokens,
} from "@/features/auth/utils/auth.storage"

let refreshPromise: Promise<string | null> | null = null

function getApiBase(): string {
  const base = OpenAPI.BASE.replace(/\/+$/, "")
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    return null
  }

  try {
    const response = await fetch(`${getApiBase()}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      return null
    }

    const data = (await response.json()) as {
      access_token?: string
      refresh_token?: string
    }

    if (!data.access_token || !data.refresh_token) {
      clearTokens()
      return null
    }

    setTokens(data.access_token, data.refresh_token, isRememberMeEnabled())
    return data.access_token
  } catch {
    return null
  }
}

export async function refreshAccessTokenIfPossible(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}
