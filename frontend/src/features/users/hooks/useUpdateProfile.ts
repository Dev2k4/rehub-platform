import { useMutation, useQueryClient } from "@tanstack/react-query"
import { updateMyProfile, type UpdateProfileInput } from "@/features/users/api/profile.api"
import type { UserMe } from "@/client"

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => updateMyProfile(data),
    onSuccess: (updatedUser: UserMe) => {
      // Invalidate and update the auth user query
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] })
      // Optionally set the new data directly
      queryClient.setQueryData(["auth", "user"], updatedUser)
    },
  })
}
