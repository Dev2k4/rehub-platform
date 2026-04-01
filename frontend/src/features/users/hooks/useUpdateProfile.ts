import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { UserMe } from "@/client"
import {
  type UpdateProfileInput,
  updateMyProfile,
} from "@/features/users/api/profile.api"

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => updateMyProfile(data),
    onSuccess: (updatedUser: UserMe) => {
      queryClient.setQueryData(["auth", "user"], updatedUser)
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] })
    },
  })
}
