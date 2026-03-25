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
import { verifyEmailSchema, type VerifyEmailInput } from "@/features/auth/utils/auth.schemas";
import { useVerifyEmailMutation } from "@/features/auth/hooks/useVerifyEmailMutation";
import { useSearch } from "@tanstack/react-router";
import { useEffect } from "react";

interface VerifyEmailFormProps {
  onError?: (error: string) => void;
}

export function VerifyEmailForm({ onError }: VerifyEmailFormProps) {
  const verifyMutation = useVerifyEmailMutation();
  const search = useSearch({ from: "/auth/verify-email" });
  const tokenFromUrl = (search as any)?.token as string | undefined;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    mode: "onBlur",
  });

  // Auto-verify if token in URL
  useEffect(() => {
    if (tokenFromUrl) {
      setValue("token", tokenFromUrl);
      verifyMutation.mutate(tokenFromUrl);
    }
  }, [tokenFromUrl, setValue]);

  function onSubmit(data: VerifyEmailInput) {
    verifyMutation.mutate(data.token, {
      onError: (error: any) => {
        if (onError) {
          onError(error?.message || "Xác thực email thất bại");
        }
      },
    });
  }

  if (verifyMutation.isSuccess) {
    return (
      <Stack gap={4} textAlign="center">
        <Box bg="green.50" border="1px" borderColor="green.200" borderRadius="md" p={6}>
          <Text fontWeight="medium" color="green.800">
            ✓ Email xác thực thành công!
          </Text>
          <Text fontSize="sm" color="green.700" mt={2}>
            Bạn sẽ được chuyển về trang chủ trong giây lát...
          </Text>
        </Box>
      </Stack>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={4}>
        {/* Token Input */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Mã xác thực từ email
          </label>
          <ChakraInput
            {...register("token")}
            type="text"
            placeholder="Dán mã xác thực từ email của bạn"
            fontFamily="mono"
            textAlign="center"
            letterSpacing="0.1em"
            borderColor={errors.token ? "red.500" : "gray.300"}
          />
          {errors.token && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.token.message}
            </Text>
          )}
        </Box>

        {/* Instructions */}
        <Box bg="blue.50" border="1px" borderColor="blue.200" borderRadius="md" p={4}>
          <Text fontSize="sm" color="blue.800">
            Bạn sẽ nhận được email chứa mã xác thực. Sao chép mã đó và dán vào trường trên, hoặc
            nhấp vào link trong email để xác thực ngay.
          </Text>
        </Box>

        {/* Error Message */}
        {verifyMutation.isError && (
          <Box bg="red.50" border="1px" borderColor="red.200" borderRadius="md" p={4}>
            <Text fontSize="sm" color="red.800">
              {(verifyMutation.error as any)?.message ||
                "Xác thực email thất bại. Vui lòng thử lại."}
            </Text>
          </Box>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting || verifyMutation.isPending}
          colorScheme="blue"
          width="full"
        >
          {isSubmitting || verifyMutation.isPending ? "Đang xác thực..." : "Xác thực Email"}
        </Button>

        {/* Resend Email Link */}
        <Box textAlign="center">
          <Text fontSize="sm" color="gray.600">
            Không nhận được email?{" "}
            <ChakraLink
              color="blue.600"
              _hover={{ color: "blue.700" }}
              onClick={(e: any) => {
                e.preventDefault();
                // TODO: Implement resend email
                alert("Tính năng gửi lại email sẽ được thêm sau");
              }}
            >
              Gửi lại
            </ChakraLink>
          </Text>
        </Box>
      </Stack>
    </Box>
  );
}
