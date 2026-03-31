import {
  Box,
  Container,
  Heading,
  Link as ChakraLink,
  Text,
  VStack,
} from "@chakra-ui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { FiArrowLeft, FiMail } from "react-icons/fi"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { toaster } from "@/components/ui/toaster"
import { useForgotPasswordMutation } from "@/features/auth/hooks/useForgotPasswordMutation"

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
})

type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const forgotPasswordMutation = useForgotPasswordMutation()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = (data: FormData) => {
    forgotPasswordMutation.mutate(data.email, {
      onSuccess: () => {
        toaster.create({
          title: "Đã gửi email đặt lại mật khẩu",
          description: "Vui lòng kiểm tra hộp thư của bạn.",
          type: "success",
        })
      },
      onError: (error: any) => {
        toaster.create({
          title: error?.message || "Không thể gửi yêu cầu",
          type: "error",
        })
      },
    })
  }

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" py={12}>
      <Container maxW="md">
        <Box bg="white" borderRadius="xl" boxShadow="md" p={8}>
          <VStack align="stretch" gap={5}>
            <VStack align="stretch" gap={1}>
              <Heading size="lg" color="gray.900">
                Quên mật khẩu
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Nhập email để nhận link đặt lại mật khẩu.
              </Text>
            </VStack>

            <Box as="form" onSubmit={handleSubmit(onSubmit)}>
              <VStack align="stretch" gap={4}>
                <Field
                  label="Email"
                  invalid={!!errors.email}
                  errorText={errors.email?.message}
                >
                  <InputGroup width="full" startElement={<FiMail color="#9CA3AF" />}>
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="example@email.com"
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
                  loading={isSubmitting || forgotPasswordMutation.isPending}
                  loadingText="Đang gửi..."
                  colorPalette="blue"
                  borderRadius="xl"
                >
                  Gửi link đặt lại mật khẩu
                </Button>
              </VStack>
            </Box>

            <ChakraLink asChild color="blue.600" _hover={{ color: "blue.700" }}>
              <Link to="/auth/login">
                <FiArrowLeft style={{ display: "inline", marginRight: "0.25rem" }} />
                Quay lại đăng nhập
              </Link>
            </ChakraLink>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}
