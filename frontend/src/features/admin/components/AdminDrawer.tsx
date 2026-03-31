import { Box, Button, Drawer, Flex, Portal, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import {
  FiArrowLeft,
  FiCheckCircle,
  FiGrid,
  FiHome,
  FiShield,
  FiShoppingBag,
  FiUsers,
  FiX,
} from "react-icons/fi"

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
]

interface AdminDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminDrawer({ open, onOpenChange }: AdminDrawerProps) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="start"
    >
      <Portal>
        <Drawer.Backdrop bg="blackAlpha.600" />
        <Drawer.Positioner>
          <Drawer.Content
            maxW="280px"
            w="80vw"
            bg="whiteAlpha.900"
            backdropFilter="blur(20px)"
          >
            <Drawer.Header borderBottom="1px" borderColor="gray.200" p={4}>
              <Flex align="center" justify="space-between">
                <Drawer.Title
                  fontSize="lg"
                  fontWeight="semibold"
                  color="gray.900"
                >
                  Admin Panel
                </Drawer.Title>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  p={1}
                  minW={0}
                >
                  <Box as={FiX} w={5} h={5} />
                </Button>
              </Flex>
            </Drawer.Header>
            <Drawer.Body p={4}>
              <Flex direction="column" gap={1}>
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => onOpenChange(false)}
                  >
                    <Flex
                      align="center"
                      gap={3}
                      px={3}
                      py={3}
                      borderRadius="xl"
                      _hover={{ bg: "whiteAlpha.600" }}
                      transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                      cursor="pointer"
                    >
                      <Box as={item.icon} w={5} h={5} color="gray.500" />
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        {item.label}
                      </Text>
                    </Flex>
                  </Link>
                ))}

                <Box my={2} borderTop="1px" borderColor="gray.100" />

                <Link to="/" onClick={() => onOpenChange(false)}>
                  <Flex
                    align="center"
                    gap={3}
                    px={3}
                    py={3}
                    borderRadius="xl"
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
              </Flex>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
