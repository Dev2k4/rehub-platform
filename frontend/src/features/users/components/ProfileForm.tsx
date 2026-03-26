import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Box, Button, Stack, Text, Input as ChakraInput, Flex, Separator } from "@chakra-ui/react"
import type { UserMe } from "@/client"

const profileSchema = z.object({
  full_name: z.string().min(2, "Tên ít nhất 2 ký tự").max(255),
  email: z.string().email("Email không hợp lệ"),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: UserMe
  onSubmit: (data: ProfileFormData) => void
  isLoading?: boolean
  onCancel?: () => void
}

export function ProfileForm({
  user,
  onSubmit,
  isLoading = false,
  onCancel,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user.full_name || "",
      email: user.email || "",
    },
  })

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={4}>
        {/* Full Name */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Họ và tên
          </label>
          <ChakraInput
            {...register("full_name")}
            type="text"
            placeholder="Nhập tên của bạn"
            borderColor={errors.full_name ? "red.500" : "gray.300"}
          />
          {errors.full_name && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.full_name.message}
            </Text>
          )}
        </Box>

        {/* Email (Read-only for now) */}
        <Box>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", marginBottom: "0.5rem" }}>
            Email
          </label>
          <ChakraInput
            {...register("email")}
            type="email"
            placeholder="email@example.com"
            disabled
            borderColor="gray.300"
            backgroundColor="gray.50"
          />
          <Text fontSize="xs" color="gray.600" mt={1}>
            Email không thể thay đổi. Liên hệ hỗ trợ nếu cần thay đổi.
          </Text>
        </Box>

        {/* Actions */}
        <Box pt={4}>
          <Separator mb={4} />
          <Flex gap={3} justify="flex-end">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                disabled={isLoading}
              >
                Hủy
              </Button>
            )}
            <Button
              type="submit"
              colorScheme="blue"
              disabled={isLoading}
            >
              Lưu thay đổi
            </Button>
          </Flex>
        </Box>
      </Stack>
    </Box>
  )
}
