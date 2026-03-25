import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { registerUser } from "@/features/auth/api/auth.api";
import { setTokens } from "@/features/auth/utils/auth.storage";
import { OpenAPI } from "@/client";
import type { RegisterInput } from "@/features/auth/utils/auth.schemas";

export function useRegisterMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const response = await registerUser(data);
      return { response, rememberMe: data.rememberMe };
    },
    onSuccess: ({ response, rememberMe }) => {
      // Save tokens
      setTokens(response.access_token, response.refresh_token, rememberMe ?? false);

      // Update OpenAPI token
      OpenAPI.TOKEN = async () => response.access_token;

      // Redirect to email verification
      navigate({ to: "/auth/verify-email" });
    },
  });
}
