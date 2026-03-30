import { Link } from "@tanstack/react-router"
import { Drawer, Portal, Button, Flex, Text, Box } from "@chakra-ui/react"
import { FiHome, FiUsers, FiCheckCircle, FiGrid, FiShield, FiX } from "react-icons/fi"

const menuItems = [
  { id: "dashboard", label: "Tổng quan", path: "/admin", icon: FiHome },
  { id: "users", label: "Quản lý người dùng", path: "/admin/users", icon: FiUsers },
  { id: "listings", label: "Phê duyệt tin đăng", path: "/admin/listings", icon: FiCheckCircle },
  { id: "categories", label: "Quản lý danh mục", path: "/admin/categories", icon: FiGrid },
  { id: "escrows", label: "Xử lý Escrow", path: "/admin/escrows", icon: FiShield },
]

interface AdminDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminDrawer({ open, onOpenChange }: AdminDrawerProps) {
  return (
    <Drawer.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} placement="start">
      <Portal>
        <Drawer.Backdrop bg="blackAlpha.600" />
        <Drawer.Positioner>
          <Drawer.Content maxW="280px" w="80vw" bg="white">
            <Drawer.Header borderBottom="1px" borderColor="gray.200" p={4}>
              <Flex align="center" justify="space-between">
                <Drawer.Title fontSize="lg" fontWeight="semibold" color="gray.900">
                  Admin Panel
                </Drawer.Title>
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} p={1} minW={0}>
                  <Box as={FiX} w={5} h={5} />
                </Button>
              </Flex>
            </Drawer.Header>
            <Drawer.Body p={4}>
              <Flex direction="column" gap={1}>
                {menuItems.map((item) => (
                  <Link key={item.id} to={item.path} onClick={() => onOpenChange(false)}>
                    <Flex
                      align="center"
                      gap={3}
                      px={3}
                      py={3}
                      borderRadius="xl"
                      _hover={{ bg: "gray.50" }}
                      transition="all 0.2s"
                      cursor="pointer"
                    >
                      <Box as={item.icon} w={5} h={5} color="gray.500" />
                      <Text fontSize="sm" fontWeight="medium" color="gray.700">
                        {item.label}
                      </Text>
                    </Flex>
                  </Link>
                ))}
              </Flex>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  )
}
