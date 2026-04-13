import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { registerUser } from "@/features/auth/api/auth.api"
import type { RegisterInput } from "@/features/auth/utils/auth.schemas"

export function useRegisterMutation() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      await registerUser(data)
      return data.email
    },
    onSuccess: (email) => {
      navigate({ to: "/auth/verify-email", search: { email } })
    },
  })
}
