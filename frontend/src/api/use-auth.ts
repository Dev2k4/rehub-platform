import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useCallback } from "react"
import {
  authLogin,
  authRegister,
  authLogout,
  authRefreshToken,
  type LoginRequest,
  type RegisterRequest,
} from "@/client"
import { ROUTES, STORAGE_KEYS } from "@/lib/constants"
import { useLocalStorage } from "@/hooks"

// Query Keys
export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
}

// Types
interface AuthUser {
  id: string
  email: string
  full_name: string
  avatar_url?: string | null
  role: "user" | "admin"
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
}

/**
 * useAuth - Authentication hook
 */
export function useAuth() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [accessToken, setAccessToken, removeAccessToken] = useLocalStorage<string | null>(
    STORAGE_KEYS.AUTH_TOKEN,
    null
  )
  const [refreshToken, setRefreshToken, removeRefreshToken] = useLocalStorage<string | null>(
    STORAGE_KEYS.REFRESH_TOKEN,
    null
  )
  const [storedUser, setStoredUser, removeStoredUser] = useLocalStorage<AuthUser | null>(
    STORAGE_KEYS.USER,
    null
  )

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authLogin({ body: data }),
    onSuccess: (response) => {
      const { access_token, refresh_token, user } = response.data as any
      setAccessToken(access_token)
      setRefreshToken(refresh_token)
      setStoredUser(user)
      queryClient.setQueryData(authKeys.user(), user)
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authRegister({ body: data }),
    onSuccess: (response) => {
      const { access_token, refresh_token, user } = response.data as any
      setAccessToken(access_token)
      setRefreshToken(refresh_token)
      setStoredUser(user)
      queryClient.setQueryData(authKeys.user(), user)
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authLogout(),
    onSettled: () => {
      removeAccessToken()
      removeRefreshToken()
      removeStoredUser()
      queryClient.clear()
      navigate({ to: ROUTES.LOGIN })
    },
  })

  // Refresh token
  const refreshMutation = useMutation({
    mutationFn: () => authRefreshToken({ body: { refresh_token: refreshToken! } }),
    onSuccess: (response) => {
      const { access_token, refresh_token } = response.data as any
      setAccessToken(access_token)
      setRefreshToken(refresh_token)
    },
    onError: () => {
      // Token refresh failed, logout
      logoutMutation.mutate()
    },
  })

  // Actions
  const login = useCallback(
    async (data: LoginRequest) => {
      return loginMutation.mutateAsync(data)
    },
    [loginMutation]
  )

  const register = useCallback(
    async (data: RegisterRequest) => {
      return registerMutation.mutateAsync(data)
    },
    [registerMutation]
  )

  const logout = useCallback(() => {
    logoutMutation.mutate()
  }, [logoutMutation])

  return {
    // State
    user: storedUser,
    accessToken,
    isAuthenticated: !!accessToken && !!storedUser,
    isLoading: loginMutation.isPending || registerMutation.isPending,

    // Actions
    login,
    register,
    logout,

    // Mutation states
    loginMutation,
    registerMutation,
    logoutMutation,
  }
}
