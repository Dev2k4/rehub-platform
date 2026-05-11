import { Box, Heading, Text, VStack } from "@chakra-ui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FiMail, FiSend } from "react-icons/fi"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { toaster } from "@/components/ui/toaster"
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout"
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
    defaultValues: { email: "" },
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
    <AuthPageLayout backTo="/auth/login" backLabel="Về đăng nhập">
      {/* Header */}
      <VStack align="center" gap={3} mb={8}>
        <Box
          w="4rem"
          h="4rem"
          borderRadius="1.25rem"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="2rem"
          style={{
            background: "linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)",
            boxShadow: "0 8px 24px rgba(245,158,11,0.15)",
          }}
        >
          🔑
        </Box>
        <Heading
          fontSize="1.5rem"
          fontWeight="900"
          color="gray.900"
          textAlign="center"
          letterSpacing="-0.02em"
        >
          Quên mật khẩu?
        </Heading>
        <Text fontSize="sm" color="gray.500" textAlign="center" maxW="320px">
          Nhập email của bạn và chúng tôi sẽ gửi link để đặt lại mật khẩu.
        </Text>
      </VStack>

      <Box as="form" onSubmit={handleSubmit(onSubmit)}>
        <VStack align="stretch" gap={5}>
          <Field
            label="Địa chỉ Email"
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
                  fontSize: "0.9rem",
                  outline: "none",
                  transition: "border-color 0.2s ease",
                }}
              />
            </InputGroup>
          </Field>

          <Button
            type="submit"
            loading={isSubmitting || forgotPasswordMutation.isPending}
            loadingText="Đang gửi..."
            w="full"
            h="2.75rem"
            borderRadius="0.875rem"
            style={{
              background: "linear-gradient(135deg, #02457A 0%, #018ABE 100%)",
              color: "white",
              fontWeight: "700",
              fontSize: "0.9rem",
              boxShadow: "0 4px 15px rgba(2,69,122,0.3)",
              transition: "all 0.2s ease",
            }}
          >
            <Box as={FiSend} mr={2} display="inline" />
            Gửi link đặt lại mật khẩu
          </Button>
        </VStack>
      </Box>
    </AuthPageLayout>
  )
}
