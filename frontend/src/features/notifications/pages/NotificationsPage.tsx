import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { FiArrowLeft, FiFilter } from "react-icons/fi"
import type { NotificationRead } from "@/client"
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu"
import { toaster } from "@/components/ui/toaster"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import {
  getMyNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifications/api/notifications.api"
import { getNotificationDestination } from "@/features/notifications/utils/notificationNavigation"

type ReadFilter = "all" | "unread" | "read"
type TypeFilter = "all" | "offer" | "order" | "escrow" | "listing" | "review"

const TYPE_FILTER_OPTIONS: Array<{ value: TypeFilter; label: string }> = [
  { value: "all", label: "Tất cả loại" },
  { value: "offer", label: "Offer" },
  { value: "order", label: "Order" },
  { value: "escrow", label: "Escrow" },
  { value: "listing", label: "Listing" },
  { value: "review", label: "Review" },
]

function matchTypeFilter(notification: NotificationRead, filter: TypeFilter): boolean {
  if (filter === "all") {
    return true
  }
  return notification.type.startsWith(`${filter}_`)
}

function getTypeBadge(type: NotificationRead["type"]): string {
  if (type.startsWith("offer_")) return "offer"
  if (type.startsWith("order_")) return "order"
  if (type.startsWith("escrow_")) return "escrow"
  if (type.startsWith("listing_")) return "listing"
  if (type.startsWith("review_")) return "review"
  return "other"
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()

  const [readFilter, setReadFilter] = useState<ReadFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getMyNotifications(),
    enabled: isAuthenticated,
  })

  const unreadCountQuery = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadNotificationsCount(),
    enabled: isAuthenticated,
  })

  const markOneMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      })
      toaster.create({ title: "Đã đánh dấu tất cả là đã đọc", type: "success" })
    },
  })

  const filteredNotifications = useMemo(() => {
    const items = notificationsQuery.data ?? []

    const filtered = items.filter((notification) => {
      if (readFilter === "read" && !notification.is_read) {
        return false
      }

      if (readFilter === "unread" && notification.is_read) {
        return false
      }

      return matchTypeFilter(notification, typeFilter)
    })

    return filtered.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [notificationsQuery.data, readFilter, typeFilter])

  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" })
    return null
  }

  if (authLoading || !user) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  const unreadCount = unreadCountQuery.data ?? 0

  const handleMarkRead = async (notificationId: string) => {
    if (markOneMutation.isPending) {
      return
    }

    try {
      await markOneMutation.mutateAsync(notificationId)
    } catch {
      toaster.create({ title: "Không thể cập nhật thông báo", type: "error" })
    }
  }

  const handleOpenNotification = async (notification: NotificationRead) => {
    if (!notification.is_read) {
      await handleMarkRead(notification.id)
    }

    const destination = getNotificationDestination(notification)
    navigate(destination as never)
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markAllMutation.isPending) {
      return
    }

    try {
      await markAllMutation.mutateAsync()
    } catch {
      toaster.create({ title: "Không thể đánh dấu tất cả", type: "error" })
    }
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="6xl" py={10} mx="auto">
        <Flex align="center" justify="space-between" mb={6}>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/" })}
            color="blue.600"
            borderRadius="xl"
            _hover={{ bg: "blue.50" }}
          >
            <FiArrowLeft style={{ marginRight: "0.5rem" }} />
            Quay lại
          </Button>
        </Flex>

        <Box mb={8}>
          <Heading size="3xl" mb={3} color="gray.900" fontWeight="extrabold">
            Thông báo
          </Heading>
          <Text color="gray.500" fontSize="lg">
            Lịch sử thông báo theo thời gian thực, có lọc và đánh dấu đã đọc.
          </Text>
        </Box>

        <Flex
          justify="space-between"
          align={{ base: "start", md: "center" }}
          direction={{ base: "column", md: "row" }}
          gap={4}
          mb={6}
        >
          <HStack
            bg="whiteAlpha.800"
            backdropFilter="blur(20px)"
            p={1.5}
            borderRadius="2xl"
            border="1px"
            borderColor="whiteAlpha.400"
            boxShadow="0 4px 20px rgba(0,0,0,0.04)"
            gap={1.5}
          >
            <Button
              onClick={() => setReadFilter("all")}
              variant={readFilter === "all" ? "solid" : "ghost"}
              colorPalette={readFilter === "all" ? "blue" : "gray"}
              borderRadius="xl"
              size="sm"
            >
              Tất cả
            </Button>
            <Button
              onClick={() => setReadFilter("unread")}
              variant={readFilter === "unread" ? "solid" : "ghost"}
              colorPalette={readFilter === "unread" ? "blue" : "gray"}
              borderRadius="xl"
              size="sm"
            >
              Chưa đọc ({unreadCount})
            </Button>
            <Button
              onClick={() => setReadFilter("read")}
              variant={readFilter === "read" ? "solid" : "ghost"}
              colorPalette={readFilter === "read" ? "blue" : "gray"}
              borderRadius="xl"
              size="sm"
            >
              Đã đọc
            </Button>
          </HStack>

          <HStack gap={3}>
            <MenuRoot>
              <MenuTrigger asChild>
                <Button variant="outline" size="sm" borderRadius="xl" px={4}>
                  <FiFilter style={{ marginRight: "0.5rem" }} />
                  {TYPE_FILTER_OPTIONS.find((item) => item.value === typeFilter)?.label}
                </Button>
              </MenuTrigger>
              <MenuContent borderRadius="xl" boxShadow="xl">
                {TYPE_FILTER_OPTIONS.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    onClick={() => setTypeFilter(option.value)}
                    bg={typeFilter === option.value ? "blue.50" : "transparent"}
                    color={typeFilter === option.value ? "blue.600" : "inherit"}
                    fontWeight={typeFilter === option.value ? "bold" : "normal"}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </MenuContent>
            </MenuRoot>

            <Button
              size="sm"
              borderRadius="xl"
              colorPalette="blue"
              variant="subtle"
              onClick={handleMarkAllRead}
              loading={markAllMutation.isPending}
              disabled={unreadCount === 0}
            >
              Đánh dấu tất cả
            </Button>
          </HStack>
        </Flex>

        <Box
          bg="whiteAlpha.800"
          backdropFilter="blur(20px)"
          border="1px"
          borderColor="whiteAlpha.400"
          borderRadius="2xl"
          p={{ base: 4, md: 6 }}
          boxShadow="0 10px 40px rgba(0,0,0,0.04)"
        >
          {notificationsQuery.isLoading ? (
            <Flex justify="center" py={12}>
              <Spinner size="lg" color="blue.500" />
            </Flex>
          ) : filteredNotifications.length === 0 ? (
            <Box py={12} textAlign="center">
              <Text fontSize="md" color="gray.500">
                Không có thông báo phù hợp bộ lọc hiện tại.
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={4}>
              {filteredNotifications.map((notification) => {
                const typeLabel = getTypeBadge(notification.type)

                return (
                  <Box
                    key={notification.id}
                    bg={notification.is_read ? "whiteAlpha.700" : "blue.50"}
                    border="1px"
                    borderColor={notification.is_read ? "gray.200" : "blue.200"}
                    borderRadius="xl"
                    p={4}
                    transition="all 0.25s"
                    _hover={{
                      bg: "white",
                      borderColor: "blue.300",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                    }}
                  >
                    <Flex justify="space-between" align="start" gap={4}>
                      <Box minW={0} flex={1}>
                        <HStack mb={2} gap={2} wrap="wrap">
                          <Badge
                            colorPalette={notification.is_read ? "gray" : "blue"}
                            variant="subtle"
                            borderRadius="full"
                          >
                            {notification.is_read ? "Đã đọc" : "Mới"}
                          </Badge>
                          <Badge colorPalette="purple" variant="subtle" borderRadius="full">
                            {typeLabel}
                          </Badge>
                        </HStack>

                        <Text fontWeight="bold" color="gray.900" lineClamp={1}>
                          {notification.title}
                        </Text>
                        <Text mt={1} color="gray.600" fontSize="sm" lineClamp={2}>
                          {notification.message}
                        </Text>
                        <Text mt={2} fontSize="xs" color="gray.500">
                          {new Date(notification.created_at).toLocaleString("vi-VN")}
                        </Text>
                      </Box>

                      <HStack gap={2} align="start">
                        {!notification.is_read && (
                          <Button
                            size="xs"
                            variant="outline"
                            borderRadius="lg"
                            onClick={() => handleMarkRead(notification.id)}
                            loading={markOneMutation.isPending}
                          >
                            Đánh dấu đã đọc
                          </Button>
                        )}
                        <Button
                          size="xs"
                          colorPalette="blue"
                          borderRadius="lg"
                          onClick={() => handleOpenNotification(notification)}
                        >
                          Mở
                        </Button>
                      </HStack>
                    </Flex>
                  </Box>
                )
              })}
            </VStack>
          )}
        </Box>
      </Container>
    </Box>
  )
}
