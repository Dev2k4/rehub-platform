import { useState } from "react"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { FiArrowLeft } from "react-icons/fi"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import {
  useMyOrders,
  useCompleteOrder,
  useCancelOrder,
} from "@/features/orders/hooks/useOrders"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"

type OrderTab = "all" | "buying" | "selling"

function statusMeta(status: string): { label: string; color: string } {
  switch (status) {
    case "pending":
      return { label: "Chờ xử lý", color: "yellow" }
    case "completed":
      return { label: "Hoàn thành", color: "green" }
    case "cancelled":
      return { label: "Đã hủy", color: "red" }
    default:
      return { label: status, color: "gray" }
  }
}

export function OrdersPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()
  const [tab, setTab] = useState<OrderTab>("all")

  const ordersQuery = useMyOrders()
  const completeMutation = useCompleteOrder()
  const cancelMutation = useCancelOrder()

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

  const allOrders = ordersQuery.data ?? []
  const filteredOrders = (() => {
    if (tab === "buying") {
      return allOrders.filter((order) => order.buyer_id === user.id)
    }
    if (tab === "selling") {
      return allOrders.filter((order) => order.seller_id === user.id)
    }
    return allOrders
  })()

  const handleComplete = async (orderId: string) => {
    await completeMutation.mutateAsync(orderId)
  }

  const handleCancel = async (orderId: string) => {
    await cancelMutation.mutateAsync(orderId)
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="5xl" py={10}>
        <Flex align="center" justify="space-between" mb={6}>
          <HStack>
            <Button variant="ghost" onClick={() => navigate({ to: "/" })} color="blue.600">
              <FiArrowLeft style={{ marginRight: "0.5rem" }} />
              Quay lại
            </Button>
            <Button variant="outline" colorPalette="blue" onClick={() => navigate({ to: "/wallet" })}>
              Ví demo
            </Button>
          </HStack>
        </Flex>

        <Heading size="lg" mb={2}>Đơn hàng của tôi</Heading>
        <Text color="gray.600" mb={6}>Quản lý các đơn mua và đơn bán của bạn.</Text>

        <HStack mb={6} gap={3}>
          <Button variant={tab === "all" ? "solid" : "outline"} onClick={() => setTab("all")}>Tất cả</Button>
          <Button variant={tab === "buying" ? "solid" : "outline"} onClick={() => setTab("buying")}>Đơn mua</Button>
          <Button variant={tab === "selling" ? "solid" : "outline"} onClick={() => setTab("selling")}>Đơn bán</Button>
        </HStack>

        {ordersQuery.isLoading ? (
          <Flex justify="center" py={10}><Spinner /></Flex>
        ) : filteredOrders.length === 0 ? (
          <Box bg="white" borderRadius="lg" p={8} textAlign="center" color="gray.500">
            Chưa có đơn hàng nào.
          </Box>
        ) : (
          <VStack align="stretch" gap={4}>
            {filteredOrders.map((order) => {
              const status = statusMeta(order.status)
              const isBuyer = order.buyer_id === user.id
              const canAct = order.status === "pending"
              return (
                <Box key={order.id} bg="white" borderRadius="lg" p={5} boxShadow="sm" border="1px" borderColor="gray.200">
                  <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={4}>
                    <Box>
                      <Text fontWeight="semibold">Mã đơn: {order.id.slice(0, 8)}...</Text>
                      <Text fontSize="sm" color="gray.600">Listing: {order.listing_id.slice(0, 8)}...</Text>
                      <Text fontSize="sm" color="gray.600">Giá trị: {formatCurrencyVnd(order.final_price)}</Text>
                      <Badge mt={2} colorPalette={status.color as any}>{status.label}</Badge>
                    </Box>
                    <HStack>
                      <Button size="sm" variant="outline" onClick={() => navigate({ to: "/orders/$id", params: { id: order.id } })}>
                        Chi tiết
                      </Button>
                      {canAct && isBuyer && (
                        <Button size="sm" colorPalette="green" onClick={() => handleComplete(order.id)} loading={completeMutation.isPending}>
                          Hoàn thành
                        </Button>
                      )}
                      {canAct && (
                        <Button size="sm" colorPalette="red" variant="outline" onClick={() => handleCancel(order.id)} loading={cancelMutation.isPending}>
                          Hủy
                        </Button>
                      )}
                    </HStack>
                  </Flex>
                </Box>
              )
            })}
          </VStack>
        )}
      </Container>
    </Box>
  )
}
