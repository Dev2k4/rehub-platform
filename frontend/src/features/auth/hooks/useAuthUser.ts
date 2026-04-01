import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { getMyProfile } from "@/features/auth/api/auth.profile"
import { isAuthenticated } from "@/features/auth/utils/auth.storage"

export function useAuthUser() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())

  useEffect(() => {
    const onTokenChanged = () => {
      setAuthenticated(isAuthenticated())
    }

    window.addEventListener("auth:token-changed", onTokenChanged)
    return () => {
      window.removeEventListener("auth:token-changed", onTokenChanged)
    }
  }, [])

  const userQuery = useQuery({
    queryKey: ["auth", "user"],
    queryFn: () => getMyProfile(),
    enabled: authenticated,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  return {
    user: authenticated ? userQuery.data || null : null,
    isLoading: userQuery.isLoading,
    isAuthenticated: authenticated,
    refetch: userQuery.refetch,
    error: userQuery.error,
  }
}
