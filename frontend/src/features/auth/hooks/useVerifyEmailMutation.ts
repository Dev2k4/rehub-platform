import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { verifyEmailToken } from "@/features/auth/api/auth.api";

export function useVerifyEmailMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (token: string) => verifyEmailToken(token),
    onSuccess: () => {
      // Email verified successfully
      // Redirect to home after 2 seconds to let user see success message
      setTimeout(() => {
        navigate({ to: "/" });
      }, 2000);
    },
  });
}
