import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { FiCheck, FiLock } from "react-icons/fi";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";
import { toaster } from "@/components/ui/toaster";
import { useResetPasswordMutation } from "@/features/auth/hooks/useResetPasswordMutation";
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout";

const schema = z.object({
  newPassword: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải chứa ít nhất một chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải chứa ít nhất một chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải chứa ít nhất một chữ số"),
});

type FormData = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = useParams({ from: "/auth/reset-password/$token" });
  const resetPasswordMutation = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "" },
  });

  const onSubmit = (data: FormData) => {
    resetPasswordMutation.mutate(
      { token, newPassword: data.newPassword },
      {
        onSuccess: () => {
          toaster.create({
            title: "Đặt lại mật khẩu thành công! 🎉",
            description: "Bạn có thể đăng nhập với mật khẩu mới.",
            type: "success",
          });
          setTimeout(() => navigate({ to: "/auth/login" }), 1200);
        },
        onError: (error: any) => {
          toaster.create({
            title: error?.message || "Không thể đặt lại mật khẩu",
            type: "error",
          });
        },
      },
    );
  };

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
            background: "linear-gradient(135deg, #D1FAE5 0%, #ECFDF5 100%)",
            boxShadow: "0 8px 24px rgba(16,185,129,0.15)",
          }}
        >
          🛡️
        </Box>
        <Heading
          fontSize="1.5rem"
          fontWeight="900"
          color="gray.900"
          textAlign="center"
          letterSpacing="-0.02em"
        >
          Đặt lại mật khẩu
        </Heading>
        <Text fontSize="sm" color="gray.500" textAlign="center" maxW="320px">
          Tạo mật khẩu mới mạnh và an toàn cho tài khoản của bạn.
        </Text>
      </VStack>

      <Box as="form" onSubmit={handleSubmit(onSubmit)}>
        <VStack align="stretch" gap={5}>
          <Field
            label="Mật khẩu mới"
            invalid={!!errors.newPassword}
            errorText={errors.newPassword?.message}
          >
            <InputGroup width="full" startElement={<FiLock color="#9CA3AF" />}>
              <input
                {...register("newPassword")}
                type="password"
                placeholder="Nhập mật khẩu mới"
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </InputGroup>
          </Field>

          {/* Password requirements */}
          <Box bg="gray.50" borderRadius="0.75rem" p={3}>
            <Text fontSize="xs" fontWeight="600" color="gray.600" mb={2}>
              Yêu cầu mật khẩu:
            </Text>
            {[
              "Ít nhất 8 ký tự",
              "Có chữ hoa (A-Z)",
              "Có chữ thường (a-z)",
              "Có chữ số (0-9)",
            ].map((req) => (
              <Box key={req} display="flex" alignItems="center" gap={2} mb={1}>
                <Box as={FiCheck} w={3} h={3} color="green.400" />
                <Text fontSize="xs" color="gray.500">
                  {req}
                </Text>
              </Box>
            ))}
          </Box>

          <Button
            type="submit"
            loading={isSubmitting || resetPasswordMutation.isPending}
            loadingText="Đang cập nhật..."
            w="full"
            h="2.75rem"
            borderRadius="0.875rem"
            style={{
              background: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
              color: "white",
              fontWeight: "700",
              fontSize: "0.9rem",
              boxShadow: "0 4px 15px rgba(16,185,129,0.3)",
            }}
          >
            <Box as={FiCheck} mr={2} display="inline" />
            Cập nhật mật khẩu
          </Button>
        </VStack>
      </Box>
    </AuthPageLayout>
  );
}
