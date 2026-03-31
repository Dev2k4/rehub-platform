import {
  Box,
  Button,
  Flex,
  Menu,
  Portal,
  Separator,
  Text,
} from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";
import {
  FiCreditCard,
  FiList,
  FiLogOut,
  FiShield,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";
import type { UserMe } from "@/client";

interface UserDropdownMenuProps {
  user: UserMe;
  onLogout: () => void;
}

export function UserDropdownMenu({ user, onLogout }: UserDropdownMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          w={10}
          h={10}
          borderRadius="full"
          bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
          _hover={{
            bg: "linear-gradient(135deg, #013A67 0%, #017AAA 100%)",
            boxShadow: "0 4px 15px rgba(2,69,122,0.4)",
          }}
          color="white"
          fontWeight="bold"
          p={0}
          minW={0}
          title={user.full_name}
          transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        >
          {user.full_name.charAt(0).toUpperCase()}
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content
            w="56"
            bg="whiteAlpha.900"
            backdropFilter="blur(16px)"
            boxShadow="0 10px 40px rgba(0,0,0,0.08)"
            borderRadius="xl"
            border="1px"
            borderColor="whiteAlpha.400"
            zIndex={50}
          >
            {/* User Info Section */}
            <Box px={4} py={3} borderBottom="1px" borderColor="whiteAlpha.400">
              <Text fontWeight="semibold" color="gray.900" fontSize="sm">
                {user.full_name}
              </Text>
              <Text fontSize="xs" color="gray.500" truncate>
                {user.email}
              </Text>
            </Box>

            {/* Menu Items */}
            <Box py={2}>
              {user.role === "admin" && (
                <>
                  <Menu.Item value="admin" asChild>
                    <Link to="/admin">
                      <Flex
                        align="center"
                        gap={3}
                        px={4}
                        py={2}
                        fontSize="sm"
                        color="gray.700"
                        _hover={{ bg: "blue.50", color: "blue.700" }}
                        transition="all 0.2s"
                        cursor="pointer"
                      >
                        <FiShield />
                        <span>Quản trị</span>
                      </Flex>
                    </Link>
                  </Menu.Item>
                  <Separator my={2} borderColor="whiteAlpha.400" />
                </>
              )}

              <Menu.Item value="my-listings" asChild>
                <Link to="/my-listings">
                  <Flex
                    align="center"
                    gap={3}
                    px={4}
                    py={2}
                    fontSize="sm"
                    color="gray.700"
                    _hover={{ bg: "blue.50", color: "blue.700" }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <FiList />
                    <span>Tin đăng của tôi</span>
                  </Flex>
                </Link>
              </Menu.Item>

              <Menu.Item value="orders" asChild>
                <Link to="/orders">
                  <Flex
                    align="center"
                    gap={3}
                    px={4}
                    py={2}
                    fontSize="sm"
                    color="gray.700"
                    _hover={{ bg: "blue.50", color: "blue.700" }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <FiShoppingBag />
                    <span>Đơn hàng của tôi</span>
                  </Flex>
                </Link>
              </Menu.Item>

              <Menu.Item value="wallet" asChild>
                <Link to="/wallet">
                  <Flex
                    align="center"
                    gap={3}
                    px={4}
                    py={2}
                    fontSize="sm"
                    color="gray.700"
                    _hover={{ bg: "blue.50", color: "blue.700" }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <FiCreditCard />
                    <span>Ví demo</span>
                  </Flex>
                </Link>
              </Menu.Item>

              <Menu.Item value="profile" asChild>
                <Link to="/profile">
                  <Flex
                    align="center"
                    gap={3}
                    px={4}
                    py={2}
                    fontSize="sm"
                    color="gray.700"
                    _hover={{ bg: "blue.50", color: "blue.700" }}
                    transition="all 0.2s"
                    cursor="pointer"
                  >
                    <FiUser />
                    <span>Hồ sơ</span>
                  </Flex>
                </Link>
              </Menu.Item>

              <Separator my={2} borderColor="whiteAlpha.400" />

              <Menu.Item value="logout" onClick={onLogout}>
                <Flex
                  align="center"
                  gap={3}
                  px={4}
                  py={2}
                  fontSize="sm"
                  color="red.600"
                  _hover={{ bg: "red.50", color: "red.700" }}
                  transition="all 0.2s"
                  cursor="pointer"
                  w="full"
                >
                  <FiLogOut />
                  <span>Đăng xuất</span>
                </Flex>
              </Menu.Item>
            </Box>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
