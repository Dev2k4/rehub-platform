import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  usersGetMe,
  usersUpdateMe,
  usersGetProfile,
} from "@/client"
import type { User, UserPublicProfile } from "@/types"

// Query Keys
export const userKeys = {
  all: ["users"] as const,
  me: () => [...userKeys.all, "me"] as const,
  profiles: () => [...userKeys.all, "profile"] as const,
  profile: (id: string) => [...userKeys.profiles(), id] as const,
}

/**
 * useCurrentUser - Get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: async () => {
      const response = await usersGetMe()
      return response.data as User
    },
  })
}

/**
 * useUpdateProfile - Update current user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await usersUpdateMe({ body: data as any })
      return response.data as User
    },
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.me(), data)
    },
  })
}

/**
 * useUserProfile - Get public profile of a user
 */
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: userKeys.profile(userId),
    queryFn: async () => {
      const response = await usersGetProfile({ path: { id: userId } })
      return response.data as UserPublicProfile
    },
    enabled: !!userId,
  })
}
