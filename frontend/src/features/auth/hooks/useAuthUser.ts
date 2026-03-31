import { useQuery } from "@tanstack/react-query"
import { getMyProfile } from "@/features/auth/api/auth.profile"
import { isAuthenticated } from "@/features/auth/utils/auth.storage"

export function useAuthUser() {
  const userQuery = useQuery({
    queryKey: ["auth", "user"],
    queryFn: () => getMyProfile(),
    enabled: isAuthenticated(), // Only run if token exists
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  return {
    user: userQuery.data || null,
    isLoading: userQuery.isLoading,
    isAuthenticated: isAuthenticated(),
    refetch: userQuery.refetch,
    error: userQuery.error,
  }
}
