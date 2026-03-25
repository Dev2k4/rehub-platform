import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { loginUser } from "@/features/auth/api/auth.api";
import { setTokens } from "@/features/auth/utils/auth.storage";
import { OpenAPI } from "@/client";
import type { LoginInput } from "@/features/auth/utils/auth.schemas";

export function useLoginMutation() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const response = await loginUser(data.email, data.password);
      return { response, rememberMe: data.rememberMe };
    },
    onSuccess: ({ response, rememberMe }) => {
      // Save tokens
      setTokens(response.access_token, response.refresh_token, rememberMe ?? false);

      // Update OpenAPI token
      OpenAPI.TOKEN = async () => response.access_token;

      // Redirect to home
      navigate({ to: "/" });
    },
  });
}
