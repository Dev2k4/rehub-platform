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
import { useForgotPasswordMutation } from "@/features/auth/hooks/useForgotPasswordMutation";
import { useState } from "react";
import { useResetPasswordMutation } from "@/features/auth/hooks/useResetPasswordMutation";
import { useSearch } from "@tanstack/react-router";

interface LoginFormProps {
  onError?: (error: string) => void;
}

export function LoginForm({ onError }: LoginFormProps) {
  const loginMutation = useLoginMutation();
  const forgotPasswordMutation = useForgotPasswordMutation();
  const resetPasswordMutation = useResetPasswordMutation();
  const search = useSearch({ from: "/auth/login" });
  const resetToken = (search as any)?.reset_token as string | undefined;
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
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

        {resetToken && (
          <Box
            bg="blue.50"
            border="1px"
            borderColor="blue.200"
            borderRadius="md"
            p={4}
          >
            <Text fontSize="sm" color="blue.800" mb={3}>
              Bạn đang đặt lại mật khẩu từ email. Nhập mật khẩu mới và bấm cập nhật.
            </Text>
            <ChakraInput
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              mt={3}
              width="full"
              bg="blue.700"
              color="white"
              _hover={{ bg: "blue.800" }}
              onClick={() => {
                if (!newPassword.trim()) {
                  if (onError) {
                    onError("Vui lòng nhập mật khẩu mới");
                  }
                  return;
                }
                resetPasswordMutation.mutate({ token: resetToken, newPassword: newPassword.trim() });
              }}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
            {resetPasswordMutation.isSuccess && (
              <Text mt={2} fontSize="sm" color="green.700">
                Đặt lại mật khẩu thành công. Đang chuyển về màn hình đăng nhập.
              </Text>
            )}
            {resetPasswordMutation.isError && (
              <Text mt={2} fontSize="sm" color="red.700">
                {(resetPasswordMutation.error as any)?.message || "Không thể đặt lại mật khẩu."}
              </Text>
            )}
          </Box>
        )}

        {/* Forgot Password Link */}
        <Box textAlign="center">
          <ChakraLink
            fontSize="sm"
            color="blue.600"
            _hover={{ color: "blue.700" }}
            onClick={(e: any) => {
              e.preventDefault();
              if (!forgotEmail.trim()) {
                if (onError) {
                  onError("Vui lòng nhập email vào ô bên dưới để đặt lại mật khẩu");
                }
                return;
              }
              forgotPasswordMutation.mutate(forgotEmail.trim());
            }}
          >
            Quên mật khẩu?
          </ChakraLink>
          <ChakraInput
            mt={3}
            type="email"
            placeholder="Nhập email để nhận link đặt lại mật khẩu"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
          {forgotPasswordMutation.isSuccess && (
            <Text mt={2} fontSize="sm" color="green.700">
              Nếu email tồn tại, hệ thống đã gửi link đặt lại mật khẩu.
            </Text>
          )}
          {forgotPasswordMutation.isError && (
            <Text mt={2} fontSize="sm" color="red.700">
              {(forgotPasswordMutation.error as any)?.message || "Không thể gửi yêu cầu đặt lại mật khẩu."}
            </Text>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
