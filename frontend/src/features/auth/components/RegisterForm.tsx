import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Box,
  Button,
  Stack,
  Text,
  VStack,
  Input as ChakraInput,
} from "@chakra-ui/react";
import { registerSchema, type RegisterInput } from "@/features/auth/utils/auth.schemas";
import { useRegisterMutation } from "@/features/auth/hooks/useRegisterMutation";
import { AuthErrorCode } from "@/features/auth/types/auth.types";

interface RegisterFormProps {
  onError?: (error: string) => void;
}

export function RegisterForm({ onError }: RegisterFormProps) {
  const registerMutation = useRegisterMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    // @ts-ignore - Zod + React Hook Form type mismatch with default values
  } = useForm<RegisterInput>({
    // @ts-ignore
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      rememberMe: false,
    },
  });

  const password = watch("password");

  function onSubmit(data: RegisterInput) {
    registerMutation.mutate(data, {
      onError: (error: any) => {
        if (error?.code === AuthErrorCode.EMAIL_ALREADY_EXISTS && onError) {
          onError(error.message);
        }
      },
    });
  }

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit as any)}>
      <Stack gap={4}>
        {/* Email */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
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

        {/* Full Name */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Họ và tên
          </label>
          <ChakraInput
            {...register("fullName")}
            type="text"
            placeholder="Nguyễn Văn A"
            borderColor={errors.fullName ? "red.500" : "gray.300"}
          />
          {errors.fullName && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.fullName.message}
            </Text>
          )}
        </Box>

        {/* Password */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
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

          {/* Password requirements */}
          {password && (
            <VStack align="start" gap={1} mt={2} fontSize="sm">
              <Text color={password.length >= 8 ? "green.600" : "gray.500"}>
                ✓ Ít nhất 8 ký tự
              </Text>
              <Text color={/[A-Z]/.test(password) ? "green.600" : "gray.500"}>
                ✓ Chứa chữ hoa
              </Text>
              <Text color={/[a-z]/.test(password) ? "green.600" : "gray.500"}>
                ✓ Chứa chữ thường
              </Text>
              <Text color={/[0-9]/.test(password) ? "green.600" : "gray.500"}>
                ✓ Chứa chữ số
              </Text>
            </VStack>
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
          <label htmlFor="rememberMe" style={{ fontSize: "0.875rem", marginLeft: "0.25rem" }}>
            Giữ tôi đăng nhập
          </label>
        </Box>

        {/* Error Message */}
        {registerMutation.isError && (
          <Box bg="red.50" border="1px" borderColor="red.200" borderRadius="md" p={4}>
            <Text fontSize="sm" color="red.800">
              {(registerMutation.error as any)?.message ||
                "Đã xảy ra lỗi. Vui lòng thử lại."}
            </Text>
          </Box>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || registerMutation.isPending}
          colorScheme="blue"
          width="full"
        >
          {isSubmitting || registerMutation.isPending ? "Đang xử lý..." : "Đăng ký"}
        </Button>
      </Stack>
    </Box>
  );
}
