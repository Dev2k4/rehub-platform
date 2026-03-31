import {
  Box,
  Input as ChakraInput,
  Flex,
  Separator,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi"
import { z } from "zod"
import type { UserMe } from "@/client"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { InputGroup } from "@/components/ui/input-group"

const profileSchema = z.object({
  full_name: z.string().min(2, "Tên ít nhất 2 ký tự").max(255),
  email: z.string().email("Email không hợp lệ"),
  bio: z.string().max(500, "Giới thiệu tối đa 500 ký tự").optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  province: z.string().max(100).optional().or(z.literal("")),
  district: z.string().max(100).optional().or(z.literal("")),
  ward: z.string().max(100).optional().or(z.literal("")),
  address_detail: z.string().max(255).optional().or(z.literal("")),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  user: UserMe
  onSubmit: (data: ProfileFormData) => void
  isLoading?: boolean
  onCancel?: () => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      fontSize="xs"
      fontWeight="semibold"
      color="gray.500"
      textTransform="uppercase"
      letterSpacing="wider"
      pt={2}
    >
      {children}
    </Text>
  )
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
      bio: (user as any).bio || "",
      phone: (user as any).phone || "",
      province: (user as any).province || "",
      district: (user as any).district || "",
      ward: (user as any).ward || "",
      address_detail: (user as any).address_detail || "",
    },
  })

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={5}>
        {/* Basic Info */}
        <SectionTitle>Thông tin cơ bản</SectionTitle>

        {/* Full Name */}
        <Field
          label="Họ và tên"
          invalid={!!errors.full_name}
          errorText={errors.full_name?.message}
        >
          <InputGroup width="full" startElement={<FiUser color="#9CA3AF" />}>
            <ChakraInput
              {...register("full_name")}
              type="text"
              placeholder="Nhập tên của bạn"
              ps="10"
            />
          </InputGroup>
        </Field>

        {/* Email (Read-only) */}
        <Field
          label="Email"
          helperText="Email không thể thay đổi. Liên hệ hỗ trợ nếu cần."
        >
          <InputGroup width="full" startElement={<FiMail color="#9CA3AF" />}>
            <ChakraInput
              {...register("email")}
              type="email"
              placeholder="email@example.com"
              disabled
              bg="gray.50"
              cursor="not-allowed"
              ps="10"
            />
          </InputGroup>
        </Field>

        {/* Phone */}
        <Field
          label="Số điện thoại"
          invalid={!!errors.phone}
          errorText={errors.phone?.message}
        >
          <InputGroup width="full" startElement={<FiPhone color="#9CA3AF" />}>
            <ChakraInput
              {...register("phone")}
              type="tel"
              placeholder="Nhập số điện thoại"
              ps="10"
            />
          </InputGroup>
        </Field>

        {/* Bio */}
        <Field
          label="Giới thiệu bản thân"
          invalid={!!errors.bio}
          errorText={errors.bio?.message}
          helperText="Tối đa 500 ký tự"
        >
          <Textarea
            {...register("bio")}
            placeholder="Viết vài dòng giới thiệu về bản thân..."
            rows={3}
            resize="vertical"
          />
        </Field>

        <Separator />

        {/* Address */}
        <SectionTitle>Địa chỉ</SectionTitle>

        <Field label="Tỉnh / Thành phố">
          <InputGroup width="full" startElement={<FiMapPin color="#9CA3AF" />}>
            <ChakraInput
              {...register("province")}
              type="text"
              placeholder="VD: Hà Nội"
              ps="10"
            />
          </InputGroup>
        </Field>

        <Field label="Quận / Huyện">
          <InputGroup width="full" startElement={<FiMapPin color="#9CA3AF" />}>
            <ChakraInput
              {...register("district")}
              type="text"
              placeholder="VD: Cầu Giấy"
              ps="10"
            />
          </InputGroup>
        </Field>

        <Field label="Phường / Xã">
          <InputGroup width="full" startElement={<FiMapPin color="#9CA3AF" />}>
            <ChakraInput
              {...register("ward")}
              type="text"
              placeholder="VD: Dịch Vọng Hậu"
              ps="10"
            />
          </InputGroup>
        </Field>

        <Field label="Địa chỉ chi tiết">
          <ChakraInput
            {...register("address_detail")}
            type="text"
            placeholder="Số nhà, tên đường..."
          />
        </Field>

        {/* Actions */}
        <Box pt={2}>
          <Separator mb={4} />
          <Flex gap={3} justify="flex-end">
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="outline"
                px={6}
                disabled={isLoading}
              >
                Hủy
              </Button>
            )}
            <Button
              type="submit"
              bg="blue.600"
              color="white"
              _hover={{ bg: "blue.700" }}
              px={6}
              loading={isLoading}
              loadingText="Đang lưu..."
              borderRadius="xl"
              boxShadow="0 4px 12px rgba(66,153,225,0.3)"
            >
              Lưu thay đổi
            </Button>
          </Flex>
        </Box>
      </Stack>
    </Box>
  )
}
