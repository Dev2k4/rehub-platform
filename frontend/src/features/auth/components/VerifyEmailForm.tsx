import { Box, Input as ChakraInput, Stack, Text } from "@chakra-ui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { FiKey, FiMail } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"
import { useResendVerificationMutation } from "@/features/auth/hooks/useResendVerificationMutation"
import { useVerifyEmailMutation } from "@/features/auth/hooks/useVerifyEmailMutation"
import {
  type VerifyEmailInput,
  verifyEmailSchema,
} from "@/features/auth/utils/auth.schemas"

interface VerifyEmailFormProps {
  onError?: (error: string) => void
}

export function VerifyEmailForm({ onError }: VerifyEmailFormProps) {
  const verifyMutation = useVerifyEmailMutation()
  const resendMutation = useResendVerificationMutation()
  const search = useSearch({ from: "/auth/verify-email" })
  const tokenFromUrl = (search as any)?.token as string | undefined
  const emailFromUrl = (search as any)?.email as string | undefined
  const [resendEmail, setResendEmail] = useState(emailFromUrl || "")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    mode: "onBlur",
  })

  // Auto-verify if token in URL
  useEffect(() => {
    if (tokenFromUrl) {
      setValue("token", tokenFromUrl)
      verifyMutation.mutate(tokenFromUrl)
    }
  }, [tokenFromUrl, setValue, verifyMutation.mutate])

  useEffect(() => {
    if (emailFromUrl) {
      setResendEmail(emailFromUrl)
    }
  }, [emailFromUrl])

  function onSubmit(data: VerifyEmailInput) {
    verifyMutation.mutate(data.token, {
      onError: (error: any) => {
        if (onError) {
          onError(error?.message || "Xác thực email thất bại")
        }
      },
    })
  }

  if (verifyMutation.isSuccess) {
    return (
      <Stack gap={4} textAlign="center">
        <Box
          bg="green.50"
          border="1px"
          borderColor="green.200"
          borderRadius="xl"
          p={6}
        >
          <Text fontWeight="medium" color="green.800">
            ✓ Email xác thực thành công!
          </Text>
          <Text fontSize="sm" color="green.700" mt={2}>
            Bạn sẽ được chuyển về trang chủ trong giây lát...
          </Text>
        </Box>
      </Stack>
    )
  }

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={5}>
        {/* Token Input */}
        <Field
          label="Mã xác thực từ email"
          invalid={!!errors.token}
          errorText={errors.token?.message}
        >
          <InputGroup width="full" startElement={<FiKey color="#9CA3AF" />}>
            <ChakraInput
              {...register("token")}
              type="text"
              placeholder="Dán mã xác thực từ email của bạn"
              fontFamily="mono"
              textAlign="center"
              letterSpacing="0.1em"
              ps="10"
            />
          </InputGroup>
        </Field>

        {/* Instructions */}
        <Box
          bg="blue.50"
          border="1px"
          borderColor="blue.200"
          borderRadius="xl"
          p={4}
        >
          <Text fontSize="sm" color="blue.800">
            Bạn sẽ nhận được email chứa mã xác thực. Sao chép mã đó và dán vào
            trường trên, hoặc nhấp vào link trong email để xác thực ngay.
          </Text>
        </Box>

        {/* Error Message */}
        {verifyMutation.isError && (
          <Box
            bg="red.50"
            border="1px"
            borderColor="red.200"
            borderRadius="xl"
            p={4}
          >
            <Text fontSize="sm" color="red.800">
              {(verifyMutation.error as any)?.message ||
                "Xác thực email thất bại. Vui lòng thử lại."}
            </Text>
          </Box>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          loading={isSubmitting || verifyMutation.isPending}
          loadingText="Đang xác thực..."
          bg="blue.600"
          color="white"
          _hover={{ bg: "blue.700" }}
          width="full"
          borderRadius="xl"
          fontWeight="semibold"
          size="lg"
          boxShadow="0 4px 15px rgba(66,153,225,0.35)"
        >
          Xác thực Email
        </Button>

        {/* Resend Email */}
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.600">
            Không nhận được email?{" "}
            <Box
              as="span"
              color="blue.600"
              fontWeight="medium"
              cursor="pointer"
              _hover={{ color: "blue.700", textDecoration: "underline" }}
              onClick={() => {
                if (!resendEmail.trim()) {
                  if (onError) {
                    onError("Vui lòng nhập email để gửi lại mã xác thực")
                  }
                  return
                }
                resendMutation.mutate(resendEmail.trim())
              }}
            >
              Gửi lại
            </Box>
          </Text>
          <InputGroup
            width="full"
            startElement={<FiMail color="#9CA3AF" />}
            mt={3}
          >
            <ChakraInput
              type="email"
              placeholder="Nhập email để gửi lại"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              ps="10"
            />
          </InputGroup>
          {resendMutation.isSuccess && (
            <Text mt={2} fontSize="sm" color="green.700">
              Email xác thực đã được gửi lại.
            </Text>
          )}
          {resendMutation.isError && (
            <Text mt={2} fontSize="sm" color="red.700">
              {(resendMutation.error as any)?.message ||
                "Không thể gửi lại email xác thực."}
            </Text>
          )}
        </Box>
      </Stack>
    </Box>
  )
}
