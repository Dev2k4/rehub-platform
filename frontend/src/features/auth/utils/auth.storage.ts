const AUTH_SESSION_KEY = "auth_session"
const REMEMBER_ME_KEY = "remember_me"

export function getAccessToken(): string | null {
  return null
}

export function getRefreshToken(): string | null {
  return null
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

  storage.setItem(AUTH_SESSION_KEY, "true")
  localStorage.setItem(REMEMBER_ME_KEY, String(rememberMe))

  // Update OpenAPI token resolver (no token in cookie mode)
  updateOpenAPIToken(null)
}

export function clearTokens(): void {
  localStorage.removeItem(REMEMBER_ME_KEY)
  localStorage.removeItem(AUTH_SESSION_KEY)
  sessionStorage.removeItem(AUTH_SESSION_KEY)

  // Clear OpenAPI token
  updateOpenAPIToken(null)
}

export function hasAccessToken(): boolean {
  return (
    localStorage.getItem(AUTH_SESSION_KEY) === "true" ||
    sessionStorage.getItem(AUTH_SESSION_KEY) === "true"
  )
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
