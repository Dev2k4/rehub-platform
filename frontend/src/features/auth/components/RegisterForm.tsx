import {
  Box,
  Input as ChakraInput,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Controller, type Resolver, useForm } from "react-hook-form"
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { toaster } from "@/components/ui/toaster"
import { useRegisterMutation } from "@/features/auth/hooks/useRegisterMutation"
import type { AuthError } from "@/features/auth/types/auth.types"
import { AuthErrorCode } from "@/features/auth/types/auth.types"
import {
  type RegisterInput,
  registerSchema,
} from "@/features/auth/utils/auth.schemas"

interface RegisterFormProps {
  onError?: (error: string) => void
}

export function RegisterForm({ onError }: RegisterFormProps) {
  const registerMutation = useRegisterMutation()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema) as Resolver<RegisterInput>,
    mode: "onBlur",
    defaultValues: {
      email: "",
      phone: "",
      password: "",
      fullName: "",
      rememberMe: false,
    },
  })

  const password = watch("password")

  function onSubmit(data: RegisterInput) {
    registerMutation.mutate(data, {
      onSuccess: () => {
        toaster.create({ title: "Đăng ký thành công!", type: "success" })
      },
      onError: (error: unknown) => {
        const authError = toAuthError(error)
        const errorMsg =
          authError?.message || "Đã xảy ra lỗi. Vui lòng thử lại."
        toaster.create({ title: errorMsg, type: "error" })
        if (authError?.code === AuthErrorCode.EMAIL_NOT_VERIFIED) {
          navigate({
            to: "/auth/verify-email",
            search: { email: data.email },
          })
          return
        }
        if (authError?.code === AuthErrorCode.EMAIL_ALREADY_EXISTS && onError) {
          onError(authError.message)
        }
      },
    })
  }

  const toAuthError = (error: unknown): AuthError | null => {
    if (!error || typeof error !== "object") {
      return null
    }
    const maybeAuthError = error as Partial<AuthError>
    if (typeof maybeAuthError.message === "string") {
      return maybeAuthError as AuthError
    }
    return null
  }

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
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

        {/* Full Name */}
        <Field
          label="Họ và tên"
          invalid={!!errors.fullName}
          errorText={errors.fullName?.message}
        >
          <InputGroup
            width="full"
            startElement={<FiUser color="#9CA3AF" />}
            startElementProps={{ ms: 3.5 }}
          >
            <ChakraInput
              {...register("fullName")}
              type="text"
              placeholder="Nguyễn Văn A"
              ps="12"
              bg="gray.50"
              borderColor="gray.200"
              _hover={{ borderColor: "blue.400" }}
              _focus={{ borderColor: "blue.500", bg: "white" }}
            />
          </InputGroup>
        </Field>

        {/* Phone */}
        <Field
          label="Số điện thoại"
          invalid={!!errors.phone}
          errorText={errors.phone?.message}
        >
          <InputGroup
            width="full"
            startElement={<FiPhone color="#9CA3AF" />}
            startElementProps={{ ms: 3.5 }}
          >
            <ChakraInput
              {...register("phone")}
              type="tel"
              placeholder="0912345678"
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
          {/* Password strength indicators */}
          {password && (
            <VStack align="start" gap={1} mt={2} fontSize="xs">
              <Text color={password.length >= 8 ? "green.600" : "gray.400"}>
                {password.length >= 8 ? "✓" : "○"} Ít nhất 8 ký tự
              </Text>
              <Text color={/[A-Z]/.test(password) ? "green.600" : "gray.400"}>
                {/[A-Z]/.test(password) ? "✓" : "○"} Chứa chữ hoa
              </Text>
              <Text color={/[a-z]/.test(password) ? "green.600" : "gray.400"}>
                {/[a-z]/.test(password) ? "✓" : "○"} Chứa chữ thường
              </Text>
              <Text color={/[0-9]/.test(password) ? "green.600" : "gray.400"}>
                {/[0-9]/.test(password) ? "✓" : "○"} Chứa chữ số
              </Text>
            </VStack>
          )}
        </Field>

        {/* Remember Me */}
        <Controller
          control={control}
          name="rememberMe"
          render={({ field }) => (
            <Checkbox
              checked={field.value}
              onCheckedChange={(e) => field.onChange(!!e.checked)}
              id="rememberMeReg"
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
          loading={isSubmitting || registerMutation.isPending}
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
          Đăng ký
        </Button>
      </Stack>
    </Box>
  )
}
