import { FiMenu, FiSearch, FiPackage, FiPlusCircle, FiBell } from "react-icons/fi"
import { Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Box,
  Flex,
  IconButton,
  Button,
  Input,
  Text,
  Link as ChakraLink,
  Menu,
  Portal,
  Separator,
  Spinner,
} from "@chakra-ui/react"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { UserDropdownMenu } from "./UserDropdownMenu"
import { AuthButtons } from "./AuthButtons"
import { logoutUser } from "@/features/auth/api/auth.api"
import { clearTokens } from "@/features/auth/utils/auth.storage"
import {
  getMyNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifications/api/notifications.api"
import type { NotificationRead } from "@/client"

function getDataField(data: NotificationRead["data"], field: string): string | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const value = (data as Record<string, unknown>)[field]
  return typeof value === "string" && value.trim() ? value : null
}

function getNotificationDestination(notification: NotificationRead):
  | { to: "/listings/$id"; params: { id: string }; search?: { offerId?: string } }
  | { to: "/sellers/$id"; params: { id: string } }
  | { to: "/my-listings" }
  | { to: "/profile" }
  | { to: "/" } {
  const listingId = getDataField(notification.data, "listing_id")
  const offerId = getDataField(notification.data, "offer_id")
  const sellerId = getDataField(notification.data, "seller_id")

  if (listingId) {
    const destination = { to: "/listings/$id" as const, params: { id: listingId } }
    if (offerId && notification.type.startsWith("offer_")) {
      return { ...destination, search: { offerId } }
    }
    return destination
  }

  if (sellerId) {
    return { to: "/sellers/$id", params: { id: sellerId } }
  }

  if (notification.type.startsWith("offer_") || notification.type.startsWith("order_")) {
    return { to: "/my-listings" }
  }

  if (notification.type.startsWith("review_")) {
    return { to: "/profile" }
  }

  return { to: "/" }
}

type MarketplaceHeaderProps = {
  keyword: string
  onKeywordChange: (value: string) => void
  onOpenCategoryMenu: () => void
  onOpenListingModal?: () => void
}

export function MarketplaceHeader({ keyword, onKeywordChange, onOpenCategoryMenu, onOpenListingModal }: MarketplaceHeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuthUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getMyNotifications(),
    enabled: isAuthenticated,
  })
  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadNotificationsCount(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
  })

  const markNotificationMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] })
    },
  })

  const markAllNotificationsMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] })
    },
  })

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      clearTokens()
      queryClient.invalidateQueries({ queryKey: ["auth"] })
      navigate({ to: "/" })
    }
  }

  const unreadCount = unreadCountQuery.data ?? 0

  const handleNotificationClick = async (notification: NotificationRead) => {
    if (!notification.is_read && !markNotificationMutation.isPending) {
      try {
        await markNotificationMutation.mutateAsync(notification.id)
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
      }
    }

    const destination = getNotificationDestination(notification)
    navigate(destination as never)
  }

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || markAllNotificationsMutation.isPending) {
      return
    }

    try {
      await markAllNotificationsMutation.mutateAsync()
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
    }
  }

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={50}
      borderBottom="1px"
      borderColor="gray.200"
      bg="whiteAlpha.800"
      backdropFilter="blur(12px)"
      px={{ base: 4, md: 6 }}
      py={{ base: 3, md: 4 }}
      boxShadow="sm"
    >
      <Flex
        mx="auto"
        maxW="1400px"
        direction={{ base: "column", sm: "row" }}
        gap={{ base: 3, sm: 6, md: 8 }}
        align={{ sm: "center" }}
        justify={{ sm: "space-between" }}
      >
        {/* Top Header Mobile / Full Header Left Desktop */}
        <Flex align="center" justify="space-between" w={{ base: "full", sm: "auto" }}>
          <Flex align="center" gap={{ base: 3, md: 4 }}>
            <IconButton
              display={{ base: "inline-flex", lg: "none" }}
              aria-label="Open category menu"
              onClick={onOpenCategoryMenu}
              h={10}
              w={10}
              borderRadius="xl"
              bg="gray.100"
              color="gray.700"
              _hover={{ bg: "gray.200" }}
            >
              <FiMenu size={20} />
            </IconButton>

            <ChakraLink asChild>
              <Link to="/">
                <Flex align="center" gap={2}>
                  <Box
                    display="flex"
                    h={10}
                    w={10}
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="xl"
                    bgGradient="linear(to-br, blue.600, purple.600)"
                  >
                    <Box as={FiPackage} w={6} h={6} color="white" />
                  </Box>
                  <Text fontSize="xl" fontWeight="semibold" color="gray.900">
                    ReHub
                  </Text>
                </Flex>
              </Link>
            </ChakraLink>
          </Flex>

          {/* Mobile Right Icons (hidden on sm+) */}
          <Flex display={{ base: "flex", sm: "none" }} align="center" gap={2}>
            <IconButton
              aria-label="Post listing"
              onClick={onOpenListingModal}
              borderRadius="full"
              bg="blue.600"
              color="white"
              h={10}
              w={10}
              _hover={{ bg: "blue.700" }}
            >
              <FiPlusCircle size={20} />
            </IconButton>
          </Flex>
        </Flex>

        {/* Search Input */}
        <Box flex={1} w="full" maxW="2xl">
          <Box position="relative">
            <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" zIndex={1}>
              <FiSearch size={20} color="gray" />
            </Box>
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="Tìm kiếm sản phẩm, danh mục, hoặc người bán..."
              w="full"
              borderRadius="full"
              border="none"
              bg="gray.100"
              py={3}
              pl={12}
              pr={4}
              fontSize="sm"
              color="gray.900"
              transition="all 0.2s"
              _placeholder={{ color: "gray.500" }}
              _focus={{ bg: "white", ring: "2", ringColor: "blue.500", ringOffset: "2", ringOffsetColor: "transparent" }}
            />
          </Box>
        </Box>

        {/* Desktop Right Icons (hidden on mobile) */}
        <Flex display={{ base: "none", sm: "flex" }} align="center" gap={2}>
          {isAuthenticated ? (
            <Menu.Root>
              <Menu.Trigger asChild>
                <IconButton
                  aria-label="Notifications"
                  position="relative"
                  borderRadius="full"
                  p={2.5}
                  color="gray.600"
                  variant="ghost"
                  _hover={{ bg: "gray.100" }}
                >
                  <FiBell size={20} />
                  {unreadCount > 0 && (
                    <Box
                      position="absolute"
                      right="6px"
                      top="6px"
                      minW={4}
                      h={4}
                      px={1}
                      borderRadius="full"
                      bg="red.500"
                      color="white"
                      fontSize="10px"
                      fontWeight="bold"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      lineHeight={1}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Box>
                  )}
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content
                    w="96"
                    bg="white"
                    boxShadow="xl"
                    borderRadius="lg"
                    border="1px"
                    borderColor="gray.200"
                    overflow="hidden"
                  >
                    <Flex align="center" justify="space-between" px={4} py={3}>
                      <Text fontWeight="semibold" color="gray.900">
                        Thông báo
                      </Text>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="blue"
                        onClick={handleMarkAllAsRead}
                        loading={markAllNotificationsMutation.isPending}
                        disabled={unreadCount === 0}
                      >
                        Đánh dấu tất cả
                      </Button>
                    </Flex>
                    <Separator />
                    <Box maxH="340px" overflowY="auto">
                      {notificationsQuery.isLoading ? (
                        <Flex py={6} justify="center">
                          <Spinner size="sm" color="blue.500" />
                        </Flex>
                      ) : notificationsQuery.data && notificationsQuery.data.length > 0 ? (
                        notificationsQuery.data.map((notification) => (
                          <Menu.Item
                            key={notification.id}
                            value={`notification-${notification.id}`}
                            py={0}
                            px={0}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <Box
                              w="full"
                              px={4}
                              py={3}
                              bg={notification.is_read ? "white" : "blue.50"}
                              borderBottom="1px"
                              borderColor="gray.100"
                            >
                              <Text fontSize="sm" fontWeight="semibold" color="gray.900" lineClamp={1}>
                                {notification.title}
                              </Text>
                              <Text fontSize="xs" color="gray.600" mt={0.5} lineClamp={2}>
                                {notification.message}
                              </Text>
                              <Text fontSize="xs" color="gray.500" mt={1}>
                                {new Date(notification.created_at).toLocaleString("vi-VN")}
                              </Text>
                            </Box>
                          </Menu.Item>
                        ))
                      ) : (
                        <Box px={4} py={8} textAlign="center">
                          <Text fontSize="sm" color="gray.500">
                            Bạn chưa có thông báo nào.
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          ) : (
            <IconButton
              aria-label="Notifications"
              borderRadius="full"
              p={2.5}
              color="gray.600"
              variant="ghost"
              _hover={{ bg: "gray.100" }}
            >
              <FiBell size={20} />
            </IconButton>
          )}

          <ChakraLink asChild>
            <Link to="/">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  onOpenListingModal?.()
                }}
                borderRadius="full"
                bg="blue.600"
                color="white"
                px={4}
                py={2.5}
                fontSize="sm"
                fontWeight="medium"
                _hover={{ bg: "blue.700" }}
              >
                <Flex align="center" gap={2}>
                  <FiPlusCircle size={16} />
                  <span>Đăng tin</span>
                </Flex>
              </Button>
            </Link>
          </ChakraLink>

          {/* Auth Section: Login buttons OR User menu */}
          {isLoading ? (
            <Box w={10} h={10} bg="gray.200" borderRadius="full" animation="pulse 2s infinite" />
          ) : isAuthenticated && user ? (
            <UserDropdownMenu user={user} onLogout={handleLogout} />
          ) : (
            <AuthButtons />
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
