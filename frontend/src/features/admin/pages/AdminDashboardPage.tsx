import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { FiCheckCircle, FiGrid, FiUsers } from "react-icons/fi"
import { useAdminCategories } from "../hooks/useAdminCategories"
import { usePendingListings } from "../hooks/useAdminListings"
import { useAdminUsers } from "../hooks/useAdminUsers"

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const {
    data: users = [],
    isLoading: usersLoading,
    isFetching: usersFetching,
  } = useAdminUsers({ limit: 200 })
  const {
    data: pendingListings = [],
    isLoading: listingsLoading,
    isFetching: listingsFetching,
  } = usePendingListings({ limit: 200 })
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isFetching: categoriesFetching,
  } = useAdminCategories()

  const isLoading = usersLoading || listingsLoading || categoriesLoading
  const isRefreshing = usersFetching || listingsFetching || categoriesFetching
  const moderationHealth =
    users.length > 0
      ? Math.round((pendingListings.length / users.length) * 100)
      : 0

  const stats = [
    {
      label: "Người dùng",
      value: users.length,
      icon: FiUsers,
      color: "blue",
    },
    {
      label: "Tin dang cho duyet",
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
      </Box>

      <Flex
        mb={6}
        bg="blue.50"
        border="1px"
        borderColor="blue.100"
        borderRadius="xl"
        p={4}
        align={{ base: "start", md: "center" }}
        justify="space-between"
        direction={{ base: "column", md: "row" }}
        gap={3}
      >
        <Box>
          <Text fontSize="sm" color="blue.700" fontWeight="semibold">
            Suc khoe kiem duyet
          </Text>
          <Text fontSize="2xl" color="blue.900" fontWeight="bold">
            {moderationHealth}%
          </Text>
          <Text fontSize="sm" color="blue.700">
            Ti le tin dang cho duyet so voi tong nguoi dung hien co.
          </Text>
        </Box>
        <HStack gap={2}>
          <Button
            size="sm"
            colorPalette="blue"
            onClick={() => navigate({ to: "/admin/listings" })}
          >
            Duyet tin dang
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/admin/users" })}
          >
            Quan ly nguoi dung
          </Button>
        </HStack>
      </Flex>

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
                {isLoading ? (
                  <HStack mt={1}>
                    <Spinner size="sm" color={`${stat.color}.500`} />
                    <Text fontSize="sm" color="gray.500">
                      Dang tai...
                    </Text>
                  </HStack>
                ) : (
                  <Heading as="h3" size="xl" color="gray.900">
                    {stat.value}
                  </Heading>
                )}
              </Box>
            </Flex>
          </Box>
        ))}
      </SimpleGrid>

      <Flex mt={4} justify="space-between" align="center">
        <Text fontSize="sm" color="gray.500">
          {isRefreshing
            ? "Du lieu dang duoc cap nhat..."
            : "Du lieu da dong bo."}
        </Text>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => navigate({ to: "/notifications" })}
        >
          Mo trang thong bao
        </Button>
      </Flex>

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
          Hanh dong de xuat
        </Heading>
        <VStack align="stretch" gap={2} fontSize="sm" color="gray.600">
          <Text>
            • <strong>Quan ly nguoi dung:</strong> Kiem tra tai khoan bat thuong
            va xu ly nhanh trang thai active.
          </Text>
          <Text>
            • <strong>Phe duyet tin dang:</strong> Uu tien cac tin dang cho
            duyet lau de giam tre cho nguoi ban.
          </Text>
          <Text>
            • <strong>Quan ly danh muc:</strong> Giu cau truc danh muc gon va
            tranh trung lap slug.
          </Text>
        </VStack>
      </Box>
    </Container>
  )
}
