import { Link, useLocation } from "@tanstack/react-router"
import { Box, Heading, VStack, Flex, Text } from "@chakra-ui/react"
import { FiHome, FiUsers, FiCheckCircle, FiGrid, FiShield } from "react-icons/fi"

const menuItems = [
  { id: "dashboard", label: "Tổng quan", path: "/admin", icon: FiHome },
  { id: "users", label: "Quản lý người dùng", path: "/admin/users", icon: FiUsers },
  { id: "listings", label: "Phê duyệt tin đăng", path: "/admin/listings", icon: FiCheckCircle },
  { id: "categories", label: "Quản lý danh mục", path: "/admin/categories", icon: FiGrid },
  { id: "escrows", label: "Xử lý Escrow", path: "/admin/escrows", icon: FiShield },
]

export function AdminSidebar() {
  const location = useLocation()

  return (
    <Box as="aside" display={{ base: "none", lg: "block" }} w="260px" flexShrink={0}>
      <Box
        position="sticky"
        top="96px"
        borderRadius="2xl"
        border="1px"
        borderColor="gray.200"
        bg="white"
        p={6}
        boxShadow="sm"
      >
        <Heading as="h2" size="md" mb={4} color="gray.900">
          Admin Panel
        </Heading>

        <VStack gap={1} align="stretch">
          {menuItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link key={item.id} to={item.path}>
                <Flex
                  align="center"
                  gap={3}
                  px={3}
                  py={3}
                  borderRadius="xl"
                  bg={active ? "blue.50" : "transparent"}
                  _hover={{ bg: active ? "blue.50" : "gray.50" }}
                  transition="all 0.2s"
                  cursor="pointer"
                >
                  <Box as={item.icon} w={5} h={5} color={active ? "blue.600" : "gray.500"} />
                  <Text fontSize="sm" fontWeight="medium" color={active ? "blue.600" : "gray.700"}>
                    {item.label}
                  </Text>
                </Flex>
              </Link>
            )
          })}
        </VStack>
      </Box>
    </Box>
  )
}
