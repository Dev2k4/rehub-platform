import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, updateUserStatus } from "../api/admin.users.api"
import type { UserMe } from "@/client"

export function useAdminUsers(params?: { skip?: number; limit?: number }) {
  return useQuery<UserMe[]>({
    queryKey: ["admin", "users", params],
    queryFn: () => getUsers(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })
}
