import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { resetPassword } from "@/features/auth/api/auth.api"

interface ResetPasswordInput {
  token: string
  newPassword: string
}

export function useResetPasswordMutation() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: ResetPasswordInput) =>
      resetPassword(data.token, data.newPassword),
    onSuccess: () => {
      setTimeout(() => {
        navigate({ to: "/auth/login" })
      }, 1500)
    },
  })
}
