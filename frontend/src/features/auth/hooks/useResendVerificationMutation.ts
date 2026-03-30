import { useMutation } from "@tanstack/react-query";
import { resendVerificationEmail } from "@/features/auth/api/auth.api";

export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) => resendVerificationEmail(email),
  });
}
