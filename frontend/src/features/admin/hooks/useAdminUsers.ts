import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { UserMe } from "@/client"
import { getUsers, updateUserStatus } from "../api/admin.users.api"

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
