import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Box,
  Button,
  Stack,
  Text,
  Input as ChakraInput,
  Textarea,
  Flex,
  Separator,
} from "@chakra-ui/react";
import type { UserMe } from "@/client";

const profileSchema = z.object({
  full_name: z.string().min(2, "Tên ít nhất 2 ký tự").max(255),
  email: z.string().email("Email không hợp lệ"),
  bio: z.string().max(500, "Giới thiệu tối đa 500 ký tự").optional(),
  phone: z.string().max(20).optional().or(z.literal("")),
  province: z.string().max(100).optional().or(z.literal("")),
  district: z.string().max(100).optional().or(z.literal("")),
  ward: z.string().max(100).optional().or(z.literal("")),
  address_detail: z.string().max(255).optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user: UserMe;
  onSubmit: (data: ProfileFormData) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "0.875rem",
        fontWeight: "500",
        color: "#374151",
        marginBottom: "0.375rem",
      }}
    >
      {children}
    </label>
  );
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
  );
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
  });

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack gap={5}>
        {/* Basic Info */}
        <SectionTitle>Thông tin cơ bản</SectionTitle>

        {/* Full Name */}
        <Box>
          <FieldLabel>Họ và tên</FieldLabel>
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

        {/* Email (Read-only) */}
        <Box>
          <FieldLabel>Email</FieldLabel>
          <ChakraInput
            {...register("email")}
            type="email"
            placeholder="email@example.com"
            disabled
            borderColor="gray.300"
            backgroundColor="gray.50"
            cursor="not-allowed"
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            Email không thể thay đổi. Liên hệ hỗ trợ nếu cần.
          </Text>
        </Box>

        {/* Phone */}
        <Box>
          <FieldLabel>Số điện thoại</FieldLabel>
          <ChakraInput
            {...register("phone")}
            type="tel"
            placeholder="Nhập số điện thoại"
            borderColor={errors.phone ? "red.500" : "gray.300"}
          />
          {errors.phone && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.phone.message}
            </Text>
          )}
        </Box>

        {/* Bio */}
        <Box>
          <FieldLabel>Giới thiệu bản thân</FieldLabel>
          <Textarea
            {...register("bio")}
            placeholder="Viết vài dòng giới thiệu về bản thân..."
            rows={3}
            borderColor={errors.bio ? "red.500" : "gray.300"}
            resize="vertical"
          />
          {errors.bio && (
            <Text color="red.500" fontSize="sm" mt={1}>
              {errors.bio.message}
            </Text>
          )}
          <Text fontSize="xs" color="gray.400" mt={1}>
            Tối đa 500 ký tự
          </Text>
        </Box>

        <Separator />

        {/* Address */}
        <SectionTitle>Địa chỉ</SectionTitle>

        <Box>
          <FieldLabel>Tỉnh / Thành phố</FieldLabel>
          <ChakraInput
            {...register("province")}
            type="text"
            placeholder="VD: Hà Nội"
            borderColor="gray.300"
          />
        </Box>

        <Box>
          <FieldLabel>Quận / Huyện</FieldLabel>
          <ChakraInput
            {...register("district")}
            type="text"
            placeholder="VD: Cầu Giấy"
            borderColor="gray.300"
          />
        </Box>

        <Box>
          <FieldLabel>Phường / Xã</FieldLabel>
          <ChakraInput
            {...register("ward")}
            type="text"
            placeholder="VD: Dịch Vọng Hậu"
            borderColor="gray.300"
          />
        </Box>

        <Box>
          <FieldLabel>Địa chỉ chi tiết</FieldLabel>
          <ChakraInput
            {...register("address_detail")}
            type="text"
            placeholder="Số nhà, tên đường..."
            borderColor="gray.300"
          />
        </Box>

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
              _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
              px={6}
              loading={isLoading}
            >
              Lưu thay đổi
            </Button>
          </Flex>
        </Box>
      </Stack>
    </Box>
  );
}
