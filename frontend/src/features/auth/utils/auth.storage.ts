const ACCESS_TOKEN_KEY = "access_token"
const REFRESH_TOKEN_KEY = "refresh_token"
const REMEMBER_ME_KEY = "remember_me"

export function getAccessToken(): string | null {
  const token =
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY)
  return token
}

export function getRefreshToken(): string | null {
  const token =
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    sessionStorage.getItem(REFRESH_TOKEN_KEY)
  return token
}

export function isRememberMeEnabled(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === "true"
}

export function setTokens(
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean = false,
): void {
  const storage = rememberMe ? localStorage : sessionStorage

  // Clear tokens from both storages
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(REMEMBER_ME_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)

  // Set tokens in chosen storage
  storage.setItem(ACCESS_TOKEN_KEY, accessToken)
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe))

  // Update OpenAPI token resolver
  updateOpenAPIToken(accessToken)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(REMEMBER_ME_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)

  // Clear OpenAPI token
  updateOpenAPIToken(null)
}

export function hasAccessToken(): boolean {
  return !!getAccessToken()
}

export function isAuthenticated(): boolean {
  return hasAccessToken()
}

function updateOpenAPIToken(token: string | null): void {
  // Update the OpenAPI token resolver to use new token
  // This is called when tokens change
  const event = new CustomEvent("auth:token-changed", { detail: { token } })
  window.dispatchEvent(event)
}
