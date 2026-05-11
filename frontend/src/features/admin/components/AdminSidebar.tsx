import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiGrid,
  FiHome,
  FiShield,
  FiShoppingBag,
  FiUsers,
} from "react-icons/fi";

const menuItems = [
  { id: "dashboard", label: "Tổng quan", path: "/admin", icon: FiHome },
  {
    id: "users",
    label: "Quản lý người dùng",
    path: "/admin/users",
    icon: FiUsers,
  },
  {
    id: "listings",
    label: "Phê duyệt tin đăng",
    path: "/admin/listings",
    icon: FiCheckCircle,
  },
  {
    id: "categories",
    label: "Quản lý danh mục",
    path: "/admin/categories",
    icon: FiGrid,
  },
  {
    id: "orders",
    label: "Quản lý đơn hàng",
    path: "/admin/orders",
    icon: FiShoppingBag,
  },
  {
    id: "escrows",
    label: "Xử lý Escrow",
    path: "/admin/escrows",
    icon: FiShield,
  },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <Box
      as="aside"
      display={{ base: "none", lg: "block" }}
      w="260px"
      flexShrink={0}
    >
      <Box
        position="sticky"
        top="96px"
        borderRadius="2xl"
        border="1px"
        borderColor="whiteAlpha.400"
        bg="whiteAlpha.800"
        backdropFilter="blur(20px)"
        p={6}
        boxShadow="0 10px 40px rgba(0,0,0,0.06)"
      >
        <Heading as="h2" size="md" mb={4} color="gray.900">
          Bảng Quản Trị
        </Heading>

        <VStack gap={1} align="stretch">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.id} to={item.path}>
                <Flex
                  align="center"
                  gap={3}
                  px={3}
                  py={3}
                  borderRadius="xl"
                  bg={active ? "blue.50" : "transparent"}
                  _hover={{ bg: active ? "blue.50" : "whiteAlpha.600" }}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  cursor="pointer"
                >
                  <Box
                    as={item.icon}
                    w={5}
                    h={5}
                    color={active ? "blue.600" : "gray.500"}
                  />
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color={active ? "blue.600" : "gray.700"}
                  >
                    {item.label}
                  </Text>
                </Flex>
              </Link>
            );
          })}

          <Box my={2} borderTop="1px" borderColor="gray.100" />

          <Link to="/">
            <Flex
              align="center"
              gap={3}
              px={3}
              py={3}
              borderRadius="xl"
              bg="transparent"
              _hover={{ bg: "whiteAlpha.600" }}
              transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
              cursor="pointer"
            >
              <Box as={FiArrowLeft} w={5} h={5} color="gray.500" />
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Quay về trang chủ
              </Text>
            </Flex>
          </Link>
        </VStack>
      </Box>
    </Box>
  );
}
