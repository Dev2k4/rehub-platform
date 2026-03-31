import {
  Box,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FiCheckCircle, FiGrid, FiUsers } from "react-icons/fi"
import { useAdminCategories } from "../hooks/useAdminCategories"
import { usePendingListings } from "../hooks/useAdminListings"
import { useAdminUsers } from "../hooks/useAdminUsers"

export function AdminDashboardPage() {
  const { data: users = [] } = useAdminUsers()
  const { data: pendingListings = [] } = usePendingListings()
  const { data: categories = [] } = useAdminCategories()

  const stats = [
    {
      label: "Người dùng",
      value: users.length,
      icon: FiUsers,
      color: "blue",
    },
    {
      label: "Tin đăng chờ duyệt",
      value: pendingListings.length,
      icon: FiCheckCircle,
      color: "yellow",
    },
    {
      label: "Danh mục",
      value: categories.length,
      icon: FiGrid,
      color: "purple",
    },
  ]

  return (
    <Container maxW="7xl" px={0}>
      <Box mb={8}>
        <Heading as="h1" size="xl" color="gray.900" mb={2}>
          Tổng quan
        </Heading>
        <Text color="gray.600">
          Chào mừng đến với trang quản trị ReHub Platform
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        {stats.map((stat) => (
          <Box
            key={stat.label}
            bg="whiteAlpha.800"
            backdropFilter="blur(20px)"
            borderRadius="xl"
            boxShadow="0 4px 20px rgba(0,0,0,0.05)"
            p={6}
            border="1px"
            borderColor="whiteAlpha.400"
          >
            <Flex align="center" gap={4}>
              <Box
                p={3}
                borderRadius="lg"
                bg={`${stat.color}.50`}
                color={`${stat.color}.600`}
              >
                <Box as={stat.icon} w={6} h={6} />
              </Box>
              <Box>
                <Text fontSize="sm" color="gray.600" fontWeight="medium">
                  {stat.label}
                </Text>
                <Heading as="h3" size="xl" color="gray.900">
                  {stat.value}
                </Heading>
              </Box>
            </Flex>
          </Box>
        ))}
      </SimpleGrid>

      <Box
        bg="whiteAlpha.800"
        backdropFilter="blur(20px)"
        borderRadius="xl"
        boxShadow="0 10px 40px rgba(0,0,0,0.06)"
        p={6}
        mt={6}
        border="1px"
        borderColor="whiteAlpha.400"
      >
        <Heading as="h2" size="md" color="gray.900" mb={4}>
          Hướng dẫn sử dụng
        </Heading>
        <VStack align="stretch" gap={2} fontSize="sm" color="gray.600">
          <Text>
            • <strong>Quản lý người dùng:</strong> Xem danh sách người dùng,
            cấm/bỏ cấm tài khoản
          </Text>
          <Text>
            • <strong>Phê duyệt tin đăng:</strong> Duyệt hoặc từ chối tin đăng
            chờ phê duyệt
          </Text>
          <Text>
            • <strong>Quản lý danh mục:</strong> Thêm, sửa, xóa danh mục sản
            phẩm
          </Text>
        </VStack>
      </Box>
    </Container>
  )
}
