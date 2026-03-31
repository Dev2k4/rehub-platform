import {
  Box,
  Input as ChakraInput,
  Link as ChakraLink,
  Stack,
  Text,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FiEye, FiEyeOff, FiLock, FiMail } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";
import { toaster } from "@/components/ui/toaster";
import { useForgotPasswordMutation } from "@/features/auth/hooks/useForgotPasswordMutation";
import { useLoginMutation } from "@/features/auth/hooks/useLoginMutation";
import { useResetPasswordMutation } from "@/features/auth/hooks/useResetPasswordMutation";
import { AuthErrorCode } from "@/features/auth/types/auth.types";
import {
  type LoginInput,
  loginSchema,
} from "@/features/auth/utils/auth.schemas";

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
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema) as any,
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  function onSubmit(data: LoginInput) {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toaster.create({ title: "Đăng nhập thành công!", type: "success" });
      },
      onError: (error: any) => {
        toaster.create({ title: getErrorMessage(error), type: "error" });
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

  const getErrorMessage = (error?: any) => {
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
      <Stack gap={5}>
        {/* Email */}
        <Field
          label="Email"
          invalid={!!errors.email}
          errorText={errors.email?.message}
        >
          <InputGroup
            width="full"
            startElement={<FiMail color="#9CA3AF" />}
            startElementProps={{ ms: 3.5 }}
          >
            <ChakraInput
              {...register("email")}
              type="email"
              placeholder="example@email.com"
              ps="12"
              bg="gray.50"
              borderColor="gray.200"
              _hover={{ borderColor: "blue.400" }}
              _focus={{ borderColor: "blue.500", bg: "white" }}
            />
          </InputGroup>
        </Field>

        {/* Password */}
        <Field
          label="Mật khẩu"
          invalid={!!errors.password}
          errorText={errors.password?.message}
        >
          <InputGroup
            width="full"
            startElement={<FiLock color="#9CA3AF" />}
            startElementProps={{ ms: 3.5 }}
            endElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  color: "#9CA3AF",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  padding: "4px",
                  marginRight: "8px",
                }}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            }
          >
            <ChakraInput
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              ps="12"
              pe="12"
              bg="gray.50"
              borderColor="gray.200"
              _hover={{ borderColor: "blue.400" }}
              _focus={{ borderColor: "blue.500", bg: "white" }}
            />
          </InputGroup>
        </Field>

        {/* Remember Me */}
        <Controller
          control={control}
          name="rememberMe"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onCheckedChange={(e) => field.onChange(!!e.checked)}
              id="rememberMe"
            >
              <Text fontSize="sm" color="gray.600">
                Ghi nhớ đăng nhập
              </Text>
            </Checkbox>
          )}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          loading={isSubmitting || loginMutation.isPending}
          loadingText="Đang xử lý..."
          bg="blue.600"
          color="white"
          _hover={{ bg: "blue.700" }}
          width="full"
          borderRadius="xl"
          fontWeight="semibold"
          size="lg"
          boxShadow="0 4px 15px rgba(66,153,225,0.35)"
        >
          Đăng nhập
        </Button>

        {resetToken && (
          <Box
            bg="blue.50"
            border="1px"
            borderColor="blue.200"
            borderRadius="xl"
            p={5}
          >
            <Text fontSize="sm" color="blue.800" mb={3}>
              Bạn đang đặt lại mật khẩu từ email. Nhập mật khẩu mới và bấm cập
              nhật.
            </Text>
            <ChakraInput
              type="password"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              bg="white"
              borderColor="blue.300"
            />
            <Button
              mt={3}
              width="full"
              bg="blue.700"
              color="white"
              _hover={{ bg: "blue.800" }}
              borderRadius="xl"
              loading={resetPasswordMutation.isPending}
              loadingText="Đang cập nhật..."
              onClick={() => {
                if (!newPassword.trim()) {
                  if (onError) {
                    onError("Vui lòng nhập mật khẩu mới");
                  }
                  return;
                }
                resetPasswordMutation.mutate(
                  { token: resetToken, newPassword: newPassword.trim() },
                  {
                    onSuccess: () => {
                      toaster.create({
                        title: "Đặt lại mật khẩu thành công!",
                        type: "success",
                      });
                      setNewPassword("");
                    },
                    onError: (err: any) => {
                      toaster.create({
                        title: err?.message || "Không thể đặt lại mật khẩu.",
                        type: "error",
                      });
                    },
                  },
                );
              }}
            >
              Cập nhật mật khẩu
            </Button>
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
                  onError(
                    "Vui lòng nhập email vào ô bên dưới để đặt lại mật khẩu",
                  );
                }
                return;
              }
              forgotPasswordMutation.mutate(forgotEmail.trim(), {
                onSuccess: () => {
                  toaster.create({
                    title: "Đã gửi link đặt lại mật khẩu vào email.",
                    type: "success",
                  });
                },
                onError: (err: any) => {
                  toaster.create({
                    title:
                      err?.message || "Không thể gửi yêu cầu đặt lại mật khẩu.",
                    type: "error",
                  });
                },
              });
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
            bg="gray.50"
            borderColor="gray.200"
            _hover={{ borderColor: "blue.400" }}
            _focus={{ borderColor: "blue.500", bg: "white" }}
          />
        </Box>
      </Stack>
    </Box>
  );
}
