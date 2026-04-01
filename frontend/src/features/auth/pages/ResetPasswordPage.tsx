import {
  Box,
  Link as ChakraLink,
  Container,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useParams } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { FiArrowLeft, FiLock } from "react-icons/fi"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { toaster } from "@/components/ui/toaster"
import { useResetPasswordMutation } from "@/features/auth/hooks/useResetPasswordMutation"

const schema = z.object({
  newPassword: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất một chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất một chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất một chữ số"),
})

type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const { token } = useParams({ from: "/auth/reset-password/$token" })
  const resetPasswordMutation = useResetPasswordMutation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      newPassword: "",
    },
  })

  const onSubmit = (data: FormData) => {
    resetPasswordMutation.mutate(
      {
        token,
        newPassword: data.newPassword,
      },
      {
        onSuccess: () => {
          toaster.create({
            title: "Đặt lại mật khẩu thành công",
            description: "Bạn có thể đăng nhập với mật khẩu mới.",
            type: "success",
          })
          setTimeout(() => {
            navigate({ to: "/auth/login" })
          }, 1200)
        },
        onError: (error: any) => {
          toaster.create({
            title: error?.message || "Không thể đặt lại mật khẩu",
            type: "error",
          })
        },
      },
    )
  }

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" py={12}>
      <Container maxW="md">
        <Box bg="white" borderRadius="xl" boxShadow="md" p={8}>
          <VStack align="stretch" gap={5}>
            <VStack align="stretch" gap={1}>
              <Heading size="lg" color="gray.900">
                Đặt lại mật khẩu
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Nhập mật khẩu mới cho tài khoản của bạn.
              </Text>
            </VStack>

            <Box as="form" onSubmit={handleSubmit(onSubmit)}>
              <VStack align="stretch" gap={4}>
                <Field
                  label="Mật khẩu mới"
                  invalid={!!errors.newPassword}
                  errorText={errors.newPassword?.message}
                >
                  <InputGroup
                    width="full"
                    startElement={<FiLock color="#9CA3AF" />}
                  >
                    <input
                      {...register("newPassword")}
                      type="password"
                      placeholder="Nhập mật khẩu mới"
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 40px",
                        border: "1px solid #E2E8F0",
                        borderRadius: "12px",
                      }}
                    />
                  </InputGroup>
                </Field>

                <Button
                  type="submit"
                  loading={isSubmitting || resetPasswordMutation.isPending}
                  loadingText="Đang cập nhật..."
                  colorPalette="blue"
                  borderRadius="xl"
                >
                  Cập nhật mật khẩu
                </Button>
              </VStack>
            </Box>

            <ChakraLink asChild color="blue.600" _hover={{ color: "blue.700" }}>
              <Link to="/auth/login">
                <FiArrowLeft
                  style={{ display: "inline", marginRight: "0.25rem" }}
                />
                Quay lại đăng nhập
              </Link>
            </ChakraLink>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}
