import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { getMyProfile } from "@/features/auth/api/auth.profile"
import { isAuthenticated } from "@/features/auth/utils/auth.storage"

export function useAuthUser() {
  const queryClient = useQueryClient()
  const [authenticated, setAuthenticated] = useState(isAuthenticated())

  useEffect(() => {
    const onTokenChanged = () => {
      // Prevent leaking account-scoped data when switching users without reload.
      queryClient.removeQueries({ queryKey: ["auth", "user"], exact: true })
      queryClient.removeQueries({ queryKey: ["orders", "me"], exact: true })
      queryClient.removeQueries({ queryKey: ["wallet", "me"], exact: true })
      queryClient.removeQueries({ queryKey: ["escrow"] })
      setAuthenticated(isAuthenticated())
    }

    window.addEventListener("auth:token-changed", onTokenChanged)
    return () => {
      window.removeEventListener("auth:token-changed", onTokenChanged)
    }
  }, [queryClient])

  const userQuery = useQuery({
    queryKey: ["auth", "user"],
    queryFn: () => getMyProfile(),
    enabled: authenticated,
    staleTime: 0,
  })

  return {
    user: authenticated ? userQuery.data || null : null,
    isLoading: userQuery.isLoading,
    isAuthenticated: authenticated,
    refetch: userQuery.refetch,
    error: userQuery.error,
  }
}
