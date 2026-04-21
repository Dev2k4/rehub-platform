import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Separator,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import {
  FiArrowLeft,
  FiAward,
  FiCalendar,
  FiEdit2,
  FiFileText,
  FiList,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPieChart,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiUser,
  FiZap,
} from "react-icons/fi"
import { toaster } from "@/components/ui/toaster"
import { sendPhoneOtp, verifyPhoneOtp } from "@/features/auth/api/auth.api"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { ProfileForm } from "@/features/users/components/ProfileForm"
import { useUpdateProfile } from "@/features/users/hooks/useUpdateProfile"

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: "Quản trị viên", color: "red" },
  user: { label: "Thành viên", color: "blue" },
  moderator: { label: "Kiểm duyệt", color: "purple" },
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
  )
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()
  const updateMutation = useUpdateProfile()

  const [isEditMode, setIsEditMode] = useState(false)
  const [otpCode, setOtpCode] = useState("")

  const sendOtpMutation = useMutation({
    mutationFn: async () => sendPhoneOtp((user as any)?.phone),
    onSuccess: (result) => {
      toaster.create({
        title: result.message,
        description: result.debug_otp
          ? `OTP demo: ${result.debug_otp}`
          : undefined,
        type: "success",
      })
    },
    onError: (error: any) => {
      toaster.create({
        title: error?.message || "Không thể gửi OTP",
        type: "error",
      })
    },
  })

  const verifyOtpMutation = useMutation({
    mutationFn: async (code: string) => verifyPhoneOtp(code),
    onSuccess: (result) => {
      toaster.create({ title: result.message, type: "success" })
      window.location.reload()
    },
    onError: (error: any) => {
      toaster.create({
        title: error?.message || "Không thể xác thực OTP",
        type: "error",
      })
    },
  })

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" })
    return null
  }

  if (authLoading || !user) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  const handleFormSubmit = async (data: any) => {
    try {
      await updateMutation.mutateAsync(data)
      setIsEditMode(false)
    } catch (error) {
      console.error("Error updating profile:", error)
    }
  }

  const roleInfo = ROLE_LABELS[user.role || "user"] ?? ROLE_LABELS.user
  const addressParts = [
    (user as any).address_detail,
    (user as any).ward,
    (user as any).district,
    (user as any).province,
  ].filter(Boolean)
  const fullAddress = addressParts.join(", ")

  // Compute member tenure in months/years
  const memberSince = new Date(user.created_at)
  const monthsAgo = Math.floor(
    (Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30),
  )
  const memberTenure =
    monthsAgo >= 12 ? `${Math.floor(monthsAgo / 12)} năm` : `${monthsAgo} tháng`

  // Profile completeness
  const completenessItems = [
    !!user.full_name,
    !!user.email,
    !!(user as any).phone,
    !!(user as any).bio,
    !!fullAddress,
    !!user.is_email_verified,
    !!(user as any).is_phone_verified,
  ]
  const completeness = Math.round(
    (completenessItems.filter(Boolean).length / completenessItems.length) * 100,
  )

  return (
    <Box
      minH="100vh"
      style={{
        background:
          "linear-gradient(160deg, #EFF6FF 0%, #F0F9FF 40%, #F8FAFC 100%)",
      }}
    >
      <Container maxW="1440px" mx="auto" px={{ base: "1rem", md: "2%" }} py={8}>
        <Box w="100%" maxW="800px" mx="auto">
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
            <Box
              bg="white"
              borderRadius="1.5rem"
              boxShadow="0 20px 60px rgba(0,0,0,0.08)"
              overflow="hidden"
              border="1px solid"
              borderColor="gray.100"
            >
              {/* Beautiful gradient banner */}
              <Box
                h={28}
                position="relative"
                overflow="hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #02457A 0%, #0369A1 50%, #018ABE 100%)",
                }}
              >
                {/* Decorative orbs */}
                <Box
                  position="absolute"
                  top="-40px"
                  left="-40px"
                  w="160px"
                  h="160px"
                  borderRadius="full"
                  bg="whiteAlpha.100"
                  filter="blur(30px)"
                />
                <Box
                  position="absolute"
                  bottom="-30px"
                  right="-20px"
                  w="120px"
                  h="120px"
                  borderRadius="full"
                  bg="whiteAlpha.100"
                  filter="blur(24px)"
                />
                <Box
                  position="absolute"
                  top="20px"
                  right="30%"
                  w="80px"
                  h="80px"
                  borderRadius="full"
                  bg="whiteAlpha.50"
                  filter="blur(16px)"
                />
              </Box>

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
                      {monthsAgo >= 12 && (
                        <Badge
                          colorPalette="yellow"
                          variant="subtle"
                          borderRadius="full"
                          px={2}
                          fontSize="xs"
                        >
                          <FiAward
                            size={12}
                            style={{ display: "inline", marginRight: "4px" }}
                          />
                          Thành viên {memberTenure}
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" color="gray.500" mt={0.5}>
                      {user.email}
                    </Text>
                  </Box>
                </Flex>

                {/* Stats Row — replaced with richer cards below */}
                {/* Profile completeness bar */}
                <Box mt={3} mb={1}>
                  <Flex justify="space-between" mb={1} align="center">
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      fontWeight="600"
                      display="flex"
                      alignItems="center"
                    >
                      <FiPieChart
                        size={12}
                        style={{ display: "inline", marginRight: "6px" }}
                      />
                      Hồ sơ hoàn thiện
                    </Text>
                    <Text fontSize="xs" color="blue.600" fontWeight="700">
                      {completeness}%
                    </Text>
                  </Flex>
                  <div className="verify-bar-track">
                    <div
                      className="verify-bar-fill"
                      style={{ width: `${completeness}%` }}
                    />
                  </div>
                </Box>

                {/* Quick action shortcuts */}
                <Flex gap={2} mt={3} wrap="wrap">
                  <Box
                    as="button"
                    onClick={() => navigate({ to: "/my-listings" })}
                    px={3}
                    py={1.5}
                    borderRadius="lg"
                    fontSize="xs"
                    fontWeight="600"
                    bg="blue.50"
                    color="blue.600"
                    border="1px solid"
                    borderColor="blue.100"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: "blue.100" }}
                  >
                    <FiList
                      size={10}
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    Tin đăng
                  </Box>
                  <Box
                    as="button"
                    onClick={() => navigate({ to: "/orders" })}
                    px={3}
                    py={1.5}
                    borderRadius="lg"
                    fontSize="xs"
                    fontWeight="600"
                    bg="green.50"
                    color="green.700"
                    border="1px solid"
                    borderColor="green.100"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: "green.100" }}
                  >
                    <FiShoppingBag
                      size={10}
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    Đơn hàng
                  </Box>
                  <Box
                    as="button"
                    onClick={() => navigate({ to: "/wallet" })}
                    px={3}
                    py={1.5}
                    borderRadius="lg"
                    fontSize="xs"
                    fontWeight="600"
                    bg="orange.50"
                    color="orange.700"
                    border="1px solid"
                    borderColor="orange.100"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: "orange.100" }}
                  >
                    <FiZap
                      size={10}
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    Ví
                  </Box>
                  <Box
                    as="button"
                    onClick={() => navigate({ to: "/offers" })}
                    px={3}
                    py={1.5}
                    borderRadius="lg"
                    fontSize="xs"
                    fontWeight="600"
                    bg="purple.50"
                    color="purple.700"
                    border="1px solid"
                    borderColor="purple.100"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ bg: "purple.100" }}
                  >
                    <FiTag
                      size={10}
                      style={{ display: "inline", marginRight: "4px" }}
                    />
                    Thương lượng
                  </Box>
                </Flex>
              </Box>

              {/* Stat Cards */}
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} px={8} pb={6}>
                <div
                  className="stat-card animate-fadeinup delay-0"
                  style={{ padding: "1rem" }}
                >
                  <div
                    className="stat-card-icon"
                    style={{
                      background: "#EFF6FF",
                      width: "2rem",
                      height: "2rem",
                    }}
                  >
                    <FiShoppingBag size={16} color="#2563eb" />
                  </div>
                  <div
                    className="stat-card-value"
                    style={{ fontSize: "1.4rem" }}
                  >
                    {(user as any).completed_orders ?? 0}
                  </div>
                  <div className="stat-card-label">Đơn hoàn thành</div>
                </div>
                <div
                  className="stat-card animate-fadeinup delay-1"
                  style={{ padding: "1rem" }}
                >
                  <div
                    className="stat-card-icon"
                    style={{
                      background: "#F0FDF4",
                      width: "2rem",
                      height: "2rem",
                    }}
                  >
                    <FiList size={16} color="#10b981" />
                  </div>
                  <div
                    className="stat-card-value"
                    style={{ fontSize: "1.4rem", color: "#10b981" }}
                  >
                    {(user as any).listing_count ?? 0}
                  </div>
                  <div className="stat-card-label">Tin đăng</div>
                </div>
                <div
                  className="stat-card animate-fadeinup delay-2"
                  style={{ padding: "1rem" }}
                >
                  <div
                    className="stat-card-icon"
                    style={{
                      background: "#FFFBEB",
                      width: "2rem",
                      height: "2rem",
                    }}
                  >
                    <FiStar size={16} color="#f59e0b" />
                  </div>
                  <div
                    className="stat-card-value"
                    style={{ fontSize: "1.4rem", color: "#f59e0b" }}
                  >
                    {(user as any).rating_avg?.toFixed(1) ?? "0.0"}
                  </div>
                  <div className="stat-card-label">
                    Đánh giá ({(user as any).rating_count ?? 0})
                  </div>
                </div>
                <div
                  className="stat-card animate-fadeinup delay-3"
                  style={{ padding: "1rem" }}
                >
                  <div
                    className="stat-card-icon"
                    style={{
                      background: "#F5F3FF",
                      width: "2rem",
                      height: "2rem",
                    }}
                  >
                    <FiZap size={16} color="#7c3aed" />
                  </div>
                  <div
                    className="stat-card-value"
                    style={{ fontSize: "1.4rem", color: "#7c3aed" }}
                  >
                    {(user as any).trust_score ?? 0}
                  </div>
                  <div className="stat-card-label">Trust Score</div>
                </div>
              </SimpleGrid>

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

                    {(user as any).phone &&
                      !(user as any).is_phone_verified && (
                        <Box pt={2}>
                          <HStack gap={2} mb={2}>
                            <Input
                              value={otpCode}
                              onChange={(event) =>
                                setOtpCode(event.target.value)
                              }
                              placeholder="Nhập OTP 6 số"
                              maxLength={6}
                              w="180px"
                            />
                            <Button
                              colorPalette="blue"
                              variant="outline"
                              onClick={() => sendOtpMutation.mutate()}
                              loading={sendOtpMutation.isPending}
                            >
                              Gửi OTP
                            </Button>
                            <Button
                              colorPalette="green"
                              onClick={() => verifyOtpMutation.mutate(otpCode)}
                              loading={verifyOtpMutation.isPending}
                              disabled={otpCode.trim().length !== 6}
                            >
                              Xác thực
                            </Button>
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            Nếu bạn vừa đổi số điện thoại, hãy lưu hồ sơ trước
                            rồi gửi OTP ở đây.
                          </Text>
                        </Box>
                      )}
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
        </Box>
      </Container>
    </Box>
  )
}
