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
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiArrowLeft } from "react-icons/fi"
import { toaster } from "@/components/ui/toaster"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"
import {
  useCancelOrder,
  useCompleteOrder,
  useMyOrders,
} from "@/features/orders/hooks/useOrders"
import { useIsUserOnline } from "@/features/shared/realtime/ws.provider"

type OrderTab = "buying" | "selling"

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
  const [tab, setTab] = useState<OrderTab>("buying")

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
    try {
      await completeMutation.mutateAsync(orderId)
      toaster.create({ title: "Đã hoàn thành đơn hàng", type: "success" })
    } catch (e: any) {
      toaster.create({
        title: e?.message || "Lỗi hoàn thành đơn hàng",
        type: "error",
      })
    }
  }

  const handleCancel = async (orderId: string) => {
    try {
      await cancelMutation.mutateAsync(orderId)
      toaster.create({ title: "Đã hủy đơn hàng", type: "info" })
    } catch (e: any) {
      toaster.create({
        title: e?.message || "Lỗi hủy đơn hàng",
        type: "error",
      })
    }
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="5xl" py={10} mx="auto">
        <Flex align="center" justify="space-between" mb={6}>
          <HStack gap={3}>
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
            <Button
              variant="ghost"
              colorPalette="blue"
              onClick={() => navigate({ to: "/wallet" })}
              borderRadius="xl"
            >
              Ví demo
            </Button>
          </HStack>
        </Flex>

        <Box mb={8}>
          <Heading size="3xl" mb={3} color="gray.900" fontWeight="extrabold">
            Đơn hàng của tôi
          </Heading>
          <Text color="gray.500" fontSize="lg">
            Quản lý các giao dịch mua và bán của bạn một cách nhanh chóng.
          </Text>
        </Box>

        <HStack
          mb={8}
          gap={1.5}
          bg="whiteAlpha.800"
          backdropFilter="blur(20px)"
          p={1.5}
          borderRadius="2xl"
          display="inline-flex"
          border="1px"
          borderColor="whiteAlpha.400"
          boxShadow="0 4px 15px rgba(0,0,0,0.04)"
        >
          <Button
            size="md"
            borderRadius="xl"
            variant={tab === "buying" ? "solid" : "ghost"}
            bg={tab === "buying" ? "blue.600" : "transparent"}
            color={tab === "buying" ? "white" : "gray.600"}
            onClick={() => setTab("buying")}
            px={8}
            _hover={tab === "buying" ? { bg: "blue.700" } : { bg: "blue.50" }}
          >
            Đơn mua
          </Button>
          <Button
            size="md"
            borderRadius="xl"
            variant={tab === "selling" ? "solid" : "ghost"}
            bg={tab === "selling" ? "blue.600" : "transparent"}
            color={tab === "selling" ? "white" : "gray.600"}
            onClick={() => setTab("selling")}
            px={8}
            _hover={tab === "selling" ? { bg: "blue.700" } : { bg: "blue.50" }}
          >
            Đơn bán
          </Button>
        </HStack>

        {ordersQuery.isLoading ? (
          <Flex justify="center" py={20}>
            <Spinner size="xl" color="blue.500" borderWidth="4px" />
          </Flex>
        ) : filteredOrders.length === 0 ? (
          <Box
            bg="whiteAlpha.800"
            backdropFilter="blur(20px)"
            borderRadius="2xl"
            p={16}
            textAlign="center"
            border="1px solid"
            borderColor="gray.100"
            boxShadow="sm"
          >
            <VStack gap={4}>
              <Text fontSize="xl" color="gray.400" fontWeight="medium">
                Chưa có đơn hàng nào trong danh sách.
              </Text>
              <Button
                variant="outline"
                colorPalette="blue"
                onClick={() => navigate({ to: "/" })}
                borderRadius="xl"
              >
                Tiếp tục mua hàng
              </Button>
            </VStack>
          </Box>
        ) : (
          <VStack align="stretch" gap={5}>
            {filteredOrders.map((order) => {
              const status = statusMeta(order.status)
              const isBuyer = order.buyer_id === user.id
              const counterpartyId = isBuyer ? order.seller_id : order.buyer_id
              const isCounterpartyOnline = useIsUserOnline(counterpartyId)
              const canAct = order.status === "pending"
              return (
                <Box
                  key={order.id}
                  bg="whiteAlpha.800"
                  backdropFilter="blur(20px)"
                  borderRadius="2xl"
                  p={8}
                  boxShadow="0 4px 25px rgba(0,0,0,0.03)"
                  border="1px"
                  borderColor="whiteAlpha.500"
                  _hover={{
                    boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                    borderColor: "blue.200",
                    transform: "translateY(-3px)",
                  }}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                >
                  <Flex
                    justify="space-between"
                    align={{ base: "start", md: "center" }}
                    direction={{ base: "column", md: "row" }}
                    gap={6}
                  >
                    <Box>
                      <Flex align="center" gap={3} mb={2}>
                        <Text
                          fontWeight="bold"
                          fontSize="2xl"
                          color="blue.600"
                          letterSpacing="tight"
                        >
                          {formatCurrencyVnd(order.final_price)}
                        </Text>
                        <Badge
                          colorPalette={status.color as any}
                          variant="surface"
                          size="lg"
                          borderRadius="full"
                          px={4}
                        >
                          {status.label}
                        </Badge>
                      </Flex>
                      <HStack fontSize="sm" color="gray.500" gap={4}>
                        <Text>
                          Mã định danh:{" "}
                          <Text
                            as="span"
                            fontFamily="mono"
                            color="gray.400"
                            fontSize="xs"
                          >
                            {order.id}
                          </Text>
                        </Text>
                      </HStack>
                      <HStack mt={2} fontSize="xs" color="gray.500" gap={2} flexWrap="wrap">
                        <Text>Đối tác:</Text>
                        <Text fontFamily="mono" color="gray.600">
                          {counterpartyId}
                        </Text>
                        <Badge
                          colorPalette={isCounterpartyOnline ? "green" : "gray"}
                          variant="subtle"
                          borderRadius="full"
                          px={2}
                        >
                          {isCounterpartyOnline ? "Online" : "Offline"}
                        </Badge>
                      </HStack>
                    </Box>
                    <HStack gap={3}>
                      <Button
                        variant="surface"
                        colorPalette="blue"
                        borderRadius="xl"
                        px={6}
                        onClick={() =>
                          navigate({
                            to: "/orders/$id",
                            params: { id: order.id },
                          })
                        }
                      >
                        Chi tiết đơn
                      </Button>
                      {canAct && isBuyer && (
                        <Button
                          colorPalette="green"
                          borderRadius="xl"
                          px={6}
                          onClick={() => handleComplete(order.id)}
                          loading={completeMutation.isPending}
                        >
                          Hoàn thành đơn
                        </Button>
                      )}
                      {canAct && (
                        <Button
                          colorPalette="red"
                          variant="outline"
                          borderRadius="xl"
                          px={6}
                          onClick={() => handleCancel(order.id)}
                          loading={cancelMutation.isPending}
                        >
                          Hủy đơn
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
