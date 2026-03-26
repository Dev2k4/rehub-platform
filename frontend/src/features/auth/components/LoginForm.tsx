import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Stack,
  Text,
  Link as ChakraLink,
  Input as ChakraInput,
} from "@chakra-ui/react";
import {
  loginSchema,
  type LoginInput,
} from "@/features/auth/utils/auth.schemas";
import { useLoginMutation } from "@/features/auth/hooks/useLoginMutation";
import { AuthErrorCode } from "@/features/auth/types/auth.types";

interface LoginFormProps {
  onError?: (error: string) => void;
}

export function LoginForm({ onError }: LoginFormProps) {
  const loginMutation = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // @ts-ignore - Zod + React Hook Form type mismatch with default values
  } = useForm<LoginInput>({
    // @ts-ignore
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  function onSubmit(data: LoginInput) {
    loginMutation.mutate(data, {
      onError: (error: any) => {
        if (
          error?.code === AuthErrorCode.RATE_LIMIT_EXCEEDED ||
          error?.code === AuthErrorCode.EMAIL_NOT_VERIFIED
        ) {
          if (onError) {
            onError(error.message);
          }
        }
      },
    });
  }

  const getErrorMessage = () => {
    const error = loginMutation.error as any;
    if (error?.code === AuthErrorCode.EMAIL_NOT_VERIFIED) {
      return "Email của bạn chưa được xác thực. Vui lòng kiểm tra email để xác thực tài khoản.";
    }
    if (error?.code === AuthErrorCode.RATE_LIMIT_EXCEEDED) {
      return "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.";
    }
    return error?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit as any)}>
      <Stack gap={4}>
        {/* Email */}
        <Box>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              marginBottom: "0.5rem",
            }}
          >
            Email
          </label>
          <ChakraInput
            {...register("email")}
            type="email"
            placeholder="example@email.com"
            borderColor={errors.email ? "red.500" : "gray.300"}
          />
          {errors.email && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.email.message}
            </Text>
          )}
        </Box>

        {/* Password */}
        <Box>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: "500",
              marginBottom: "0.5rem",
            }}
          >
            Mật khẩu
          </label>
          <ChakraInput
            {...register("password")}
            type="password"
            placeholder="••••••••"
            borderColor={errors.password ? "red.500" : "gray.300"}
          />
          {errors.password && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.password.message}
            </Text>
          )}
        </Box>

        {/* Remember Me */}
        <Box>
          <input
            {...register("rememberMe")}
            type="checkbox"
            id="rememberMe"
            style={{ marginRight: "0.5rem" }}
          />
          <label
            htmlFor="rememberMe"
            style={{ fontSize: "0.875rem", marginLeft: "0.25rem" }}
          >
            Giữ tôi đăng nhập
          </label>
        </Box>

        {/* Error Message */}
        {loginMutation.isError && (
          <Box
            bg="red.50"
            border="1px"
            borderColor="red.200"
            borderRadius="md"
            p={4}
          >
            <Text fontSize="sm" color="red.800">
              {getErrorMessage()}
            </Text>
          </Box>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || loginMutation.isPending}
          bg="blue.600"
          color="white"
          _hover={{ bg: "blue.700" }}
          _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
          width="full"
          borderRadius="md"
          fontWeight="medium"
        >
          {isSubmitting || loginMutation.isPending
            ? "Đang xử lý..."
            : "Đăng nhập"}
        </Button>

        {/* Forgot Password Link */}
        <Box textAlign="center">
          <ChakraLink
            fontSize="sm"
            color="blue.600"
            _hover={{ color: "blue.700" }}
            onClick={(e: any) => {
              e.preventDefault();
              // TODO: Implement forgot password
              alert("Tính năng quên mật khẩu sẽ được thêm sau");
            }}
          >
            Quên mật khẩu?
          </ChakraLink>
        </Box>
      </Stack>
    </Box>
  );
}
