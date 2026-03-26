import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Spinner,
  Separator,
} from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import {
  FiEdit2,
  FiMail,
  FiPhone,
  FiUser,
  FiCalendar,
  FiMapPin,
  FiStar,
  FiFileText,
  FiArrowLeft,
} from "react-icons/fi";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { useUpdateProfile } from "@/features/users/hooks/useUpdateProfile";
import { ProfileForm } from "@/features/users/components/ProfileForm";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: "Quản trị viên", color: "red" },
  user: { label: "Thành viên", color: "blue" },
  moderator: { label: "Kiểm duyệt", color: "purple" },
};

function StarRating({ score }: { score: number }) {
  const maxStars = 5;
  const filledStars = Math.round((score / 100) * maxStars);
  return (
    <HStack gap={1}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Box
          key={i}
          as={FiStar}
          w={4}
          h={4}
          color={i < filledStars ? "yellow.400" : "gray.300"}
          fill={i < filledStars ? "currentColor" : "none"}
        />
      ))}
      <Text fontSize="sm" color="gray.600" ml={1}>
        {(((score || 0) / 100) * 5).toFixed(1)} / 5
      </Text>
    </HStack>
  );
}

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <Badge
      size="sm"
      colorPalette={verified ? "green" : "gray"}
      variant="outline"
      borderRadius="full"
      px={2}
      py={0}
      fontSize="10px"
    >
      {verified ? "Đã xác thực" : "Chưa xác thực"}
    </Badge>
  );
}

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser();
  const updateMutation = useUpdateProfile();

  const [isEditMode, setIsEditMode] = useState(false);

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" });
    return null;
  }

  if (authLoading || !user) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  const handleFormSubmit = async (data: any) => {
    try {
      await updateMutation.mutateAsync(data);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const roleInfo = ROLE_LABELS[user.role || "user"] ?? ROLE_LABELS["user"];
  const addressParts = [
    (user as any).address_detail,
    (user as any).ward,
    (user as any).district,
    (user as any).province,
  ].filter(Boolean);
  const fullAddress = addressParts.join(", ");

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="2xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }} py={8}>
        {/* Top Actions */}
        <Flex align="center" justify="space-between" mb={6}>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/" })}
            color="blue.600"
            _hover={{ bg: "blue.50" }}
            px={4}
          >
            <FiArrowLeft style={{ marginRight: "0.5rem" }} />
            Quay lại trang chủ
          </Button>

          {!isEditMode && (
            <Button
              onClick={() => setIsEditMode(true)}
              bg="blue.600"
              color="white"
              _hover={{ bg: "blue.700" }}
              borderRadius="md"
              fontWeight="medium"
              size="sm"
              px={4}
            >
              <FiEdit2 style={{ marginRight: "0.5rem" }} />
              Chỉnh sửa
            </Button>
          )}
        </Flex>

        {/* Profile Card */}
        {isEditMode ? (
          // Edit Mode
          <Box
            bg="white"
            borderRadius="xl"
            boxShadow="md"
            p={8}
            mt={isEditMode ? 6 : 0}
          >
            <Heading as="h2" size="lg" color="gray.900" mb={6}>
              Chỉnh sửa thông tin
            </Heading>
            <ProfileForm
              user={user}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsEditMode(false)}
              isLoading={updateMutation.isPending}
            />
          </Box>
        ) : (
          <Box bg="white" borderRadius="xl" boxShadow="md" overflow="hidden">
            {/* Avatar strip */}
            <Box bg="blue.600" h={24} />

            {/* User Header */}
            <Box px={8} mt={-11} pb={6} position="relative" zIndex={10}>
              <Flex align="center" gap={6} mb={4}>
                <Box
                  w="88px"
                  h="88px"
                  bg="white"
                  color="gray.400"
                  border="4px solid"
                  borderColor="white"
                  borderRadius="full"
                  boxShadow="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgColor="gray.100"
                  flexShrink={0}
                >
                  <FiUser size={36} color="#9ca3af" />
                </Box>
                <Box pb={1}>
                  <HStack gap={4} align="center" flexWrap="wrap">
                    <Heading as="h2" size="lg" color="gray.900">
                      {user.full_name || "Chưa cập nhật"}
                    </Heading>
                    <Badge
                      colorPalette={roleInfo.color as any}
                      variant="subtle"
                      borderRadius="full"
                      px={2}
                      py={0.5}
                      fontSize="xs"
                      fontWeight="semibold"
                    >
                      {roleInfo.label}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" mt={0.5}>
                    {user.email}
                  </Text>
                </Box>
              </Flex>

              {/* Stats Row */}
              <Flex gap={6} bg="gray.50" borderRadius="lg" p={4} wrap="wrap">
                <Box textAlign="center" minW="80px">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {(user as any).completed_orders ?? 0}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={0.5}>
                    Đơn hoàn thành
                  </Text>
                </Box>
                <Separator orientation="vertical" h="auto" />
                <Box>
                  <StarRating score={(user as any).trust_score ?? 0} />
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Độ tin cậy
                  </Text>
                </Box>
                <Separator orientation="vertical" h="auto" />
                <Box textAlign="center" minW="80px">
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {(user as any).rating_avg?.toFixed(1) ?? "0.0"}
                  </Text>
                  <Text fontSize="xs" color="gray.500" mt={0.5}>
                    Đánh giá ({(user as any).rating_count ?? 0})
                  </Text>
                </Box>
              </Flex>
            </Box>

            <Separator />

            {/* Profile Details */}
            <VStack gap={0} align="stretch" divideY="1px">
              {/* Bio */}
              <Box px={8} py={5}>
                <HStack gap={2} mb={2}>
                  <Box as={FiFileText} w={4} h={4} color="gray.400" />
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.600"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Giới thiệu
                  </Text>
                </HStack>
                <Text color="gray.700" fontSize="sm" lineHeight={1.8}>
                  {(user as any).bio || (
                    <Text as="span" color="gray.400" fontStyle="italic">
                      Chưa có mô tả. Nhấn "Chỉnh sửa" để thêm giới thiệu bản
                      thân.
                    </Text>
                  )}
                </Text>
              </Box>

              {/* Contact */}
              <Box px={8} py={5}>
                <HStack gap={2} mb={3}>
                  <Box as={FiPhone} w={4} h={4} color="gray.400" />
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.600"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Liên hệ
                  </Text>
                </HStack>
                <VStack align="stretch" gap={3}>
                  <HStack gap={3} justify="space-between">
                    <HStack gap={3}>
                      <Box
                        as={FiMail}
                        w={4}
                        h={4}
                        color="gray.300"
                        flexShrink={0}
                      />
                      <Text fontSize="sm" color="gray.700">
                        {user.email}
                      </Text>
                    </HStack>
                    {user.email && (
                      <VerificationBadge
                        verified={user.is_email_verified ?? false}
                      />
                    )}
                  </HStack>
                  <HStack gap={3} justify="space-between">
                    <HStack gap={3}>
                      <Box
                        as={FiPhone}
                        w={4}
                        h={4}
                        color="gray.300"
                        flexShrink={0}
                      />
                      <Text
                        fontSize="sm"
                        color={(user as any).phone ? "gray.700" : "gray.400"}
                      >
                        {(user as any).phone || "Chưa cập nhật số điện thoại"}
                      </Text>
                    </HStack>
                    {(user as any).phone && (
                      <VerificationBadge
                        verified={(user as any).is_phone_verified ?? false}
                      />
                    )}
                  </HStack>
                </VStack>
              </Box>

              {/* Address */}
              <Box px={8} py={5}>
                <HStack gap={2} mb={3}>
                  <Box as={FiMapPin} w={4} h={4} color="gray.400" />
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.600"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Địa chỉ
                  </Text>
                </HStack>
                {fullAddress ? (
                  <Text fontSize="sm" color="gray.700">
                    {fullAddress}
                  </Text>
                ) : (
                  <Text fontSize="sm" color="gray.400" fontStyle="italic">
                    Chưa cập nhật địa chỉ
                  </Text>
                )}
              </Box>

              {/* Member Since */}
              <Box px={8} py={5}>
                <HStack gap={2} mb={2}>
                  <Box as={FiCalendar} w={4} h={4} color="gray.400" />
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.600"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Thành viên từ
                  </Text>
                </HStack>
                <Text fontSize="sm" color="gray.700">
                  {new Date(user.created_at).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </Box>
            </VStack>
          </Box>
        )}
      </Container>
    </Box>
  );
}
