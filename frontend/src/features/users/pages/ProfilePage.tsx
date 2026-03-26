import { useState } from "react"
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
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { FiEdit2, FiMail, FiUser, FiCheck, FiCalendar } from "react-icons/fi"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { useUpdateProfile } from "@/features/users/hooks/useUpdateProfile"
import { ProfileForm } from "@/features/users/components/ProfileForm"

export function ProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()
  const updateMutation = useUpdateProfile()

  const [isEditMode, setIsEditMode] = useState(false)

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

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Hero Banner */}
      <Box
        borderRadius="none"
        bgGradient="linear(to-r, blue.600, purple.600)"
        p={6}
        color="white"
        textAlign="center"
        mb={8}
      >
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color="blue.100" fontWeight="medium">
          Tài khoản cá nhân
        </Text>
        <Heading as="h1" mt={2} fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold">
          Hồ sơ cá nhân
        </Heading>
        <Text mt={2} fontSize={{ base: "sm", md: "md" }} color="blue.50">
          Quản lý thông tin tài khoản và cài đặt của bạn
        </Text>
      </Box>

      <Container maxW="2xl" px={{ base: 4, sm: 6, lg: 8 }} pb={8}>
        {/* Edit Button */}
        {!isEditMode && (
          <Flex justify="flex-end" mb={6}>
            <Button onClick={() => setIsEditMode(true)} colorScheme="blue">
              <FiEdit2 style={{ marginRight: "0.5rem" }} />
              Chỉnh sửa
            </Button>
          </Flex>
        )}

        {/* Profile Card */}
        {isEditMode ? (
          // Edit Mode
          <Box bg="white" borderRadius="lg" boxShadow="sm" p={8}>
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
          // View Mode
          <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
            {/* User Avatar/Header */}
            <Box bgGradient="linear(to-r, blue.500, purple.600)" h={32} />

            {/* User Info */}
            <Box px={8} py={6} mt={-16} position="relative" zIndex={10} mb={6}>
              <Flex align="flex-end" gap={6}>
                <Box
                  w="96px"
                  h="96px"
                  bg="gray.200"
                  color="gray.400"
                  border="4px solid"
                  borderColor="white"
                  borderRadius="full"
                  boxShadow="lg"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <FiUser size={40} />
                </Box>
                <Box>
                  <Heading as="h2" size="xl" color="gray.900">
                    {user.full_name}
                  </Heading>
                  <Text color="gray.600">{user.role || "Thành viên"}</Text>
                </Box>
              </Flex>
            </Box>

            {/* Profile Details */}
            <Box px={8} py={6} borderTopWidth="1px" borderColor="gray.200">
              <VStack gap={6} align="stretch">
                {/* Email */}
                <Box>
                  <HStack gap={3} mb={2}>
                    <FiMail color="gray" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Email
                    </Text>
                  </HStack>
                  <Text color="gray.900" ml={8}>
                    {user.email}
                  </Text>
                </Box>

                {/* Account Status */}
                <Box>
                  <HStack gap={3} mb={2}>
                    <FiCheck color="gray" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Trạng thái tài khoản
                    </Text>
                  </HStack>
                  <Box ml={8}>
                    <Badge colorPalette="green" variant="subtle" borderRadius="full" px={3} py={1}>
                      Hoạt động
                    </Badge>
                  </Box>
                </Box>

                {/* Member Since */}
                <Box>
                  <HStack gap={3} mb={2}>
                    <FiCalendar color="gray" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      Tham gia từ
                    </Text>
                  </HStack>
                  <Text color="gray.900" ml={8}>
                    {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </Text>
                </Box>

                {/* Additional Info */}
                {user.is_email_verified !== undefined && (
                  <Box>
                    <HStack gap={3} mb={2}>
                      <Text fontSize="lg">📧</Text>
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        Email xác thực
                      </Text>
                    </HStack>
                    <Box ml={8}>
                      <Badge
                        colorPalette={user.is_email_verified ? "green" : "yellow"}
                        variant="subtle"
                        borderRadius="full"
                        px={3}
                        py={1}
                      >
                        {user.is_email_verified ? "Đã xác thực" : "Chưa xác thực"}
                      </Badge>
                    </Box>
                  </Box>
                )}
              </VStack>
            </Box>

            {/* Action Section */}
            <Box px={8} py={6} borderTopWidth="1px" borderColor="gray.200" bg="gray.50">
              <VStack gap={3} align="stretch">
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  w="full"
                  px={4}
                  py={3}
                  _hover={{ bg: "white" }}
                  color="gray.700"
                  fontWeight="medium"
                >
                  Đổi mật khẩu
                </Button>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  w="full"
                  px={4}
                  py={3}
                  _hover={{ bg: "white" }}
                  color="gray.700"
                  fontWeight="medium"
                >
                  Cài đặt quyền riêng tư
                </Button>
                <Button
                  variant="ghost"
                  justifyContent="flex-start"
                  w="full"
                  px={4}
                  py={3}
                  _hover={{ bg: "white" }}
                  color="red.600"
                  fontWeight="medium"
                >
                  Đăng xuất tất cả các phiên
                </Button>
              </VStack>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  )
}
