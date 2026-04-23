import {
  Badge,
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
import { useEffect, useMemo, useState } from "react"
import {
  FiArrowLeft,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiMessageSquare,
  FiShield,
  FiShoppingCart,
  FiStar,
  FiTruck,
} from "react-icons/fi"
import { toaster } from "@/components/ui/toaster"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { useEscrow } from "@/features/escrow/hooks/useEscrow"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"
import {
  useCancelOrder,
  useCompleteOrder,
  useMyOrders,
} from "@/features/orders/hooks/useOrders"
import {
  deriveFulfillmentStatus,
  fulfillmentStatusMeta,
  type FulfillmentStatus,
  type OrderWithFulfillment,
} from "@/features/orders/utils/orderFulfillment"
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
    case "disputed":
      return { label: "Tranh chấp", color: "red" }
    default:
      return { label: status, color: "gray" }
  }
}

// Mini order status timeline
function OrderStatusTracker({
  fulfillmentStatus,
  hasEscrow,
}: {
  fulfillmentStatus: FulfillmentStatus
  hasEscrow: boolean
}) {
  const steps = hasEscrow
    ? [
        {
          key: "created",
          label: "Đặt hàng",
          icon: <FiBox size={14} style={{ display: "inline" }} />,
        },
        {
          key: "funded",
          label: "Nạp quỹ",
          icon: <FiShield size={14} style={{ display: "inline" }} />,
        },
        {
          key: "seller_marked_delivered",
          label: "Người bán báo giao",
          icon: <FiTruck size={14} style={{ display: "inline" }} />,
        },
        {
          key: "buyer_confirmed_received",
          label: "Người mua xác nhận",
          icon: <FiStar size={14} style={{ display: "inline" }} />,
        },
      ]
    : [
        {
          key: "created",
          label: "Đặt hàng",
          icon: <FiBox size={14} style={{ display: "inline" }} />,
        },
        {
          key: "buyer_confirmed_received",
          label: "Hoàn tất",
          icon: <FiStar size={14} style={{ display: "inline" }} />,
        },
      ]

  const stepIndexByStatus: Record<FulfillmentStatus, number> = {
    created: 0,
    awaiting_funding: 0,
    funded: hasEscrow ? 1 : 0,
    seller_marked_delivered: hasEscrow ? 2 : 0,
    buyer_confirmed_received: hasEscrow ? 3 : 1,
    disputed: -1,
    resolved_refund: -1,
    cancelled: -1,
  }
  const stepIndex = stepIndexByStatus[fulfillmentStatus]

  return (
    <div className="status-tracker">
      {steps.map((step, i) => {
        const isDone = i < stepIndex
        const isActive = i === stepIndex
        const cls = isDone ? "done" : isActive ? "active" : "pending"
        return (
          <Box key={step.key} display="contents">
            <div key={step.key} className="status-step">
              <div className={`status-step-dot ${cls}`}>
                {isDone ? (
                  <FiCheckCircle size={14} style={{ display: "inline" }} />
                ) : (
                  step.icon
                )}
              </div>
              <span className={`status-step-label ${cls}`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`status-connector ${isDone ? "done" : "pending"}`}
              />
            )}
          </Box>
        )
      })}
    </div>
  )
}

type OrderListItemProps = {
  order: OrderWithFulfillment
  userId: string
  navigate: ReturnType<typeof useNavigate>
  completePending: boolean
  cancelPending: boolean
  onComplete: (orderId: string) => Promise<void>
  onCancel: (orderId: string) => Promise<void>
}

function OrderListItem({
  order,
  userId,
  navigate,
  completePending,
  cancelPending,
  onComplete,
  onCancel,
}: OrderListItemProps) {
  const status = statusMeta(order.status)
  const isBuyer = order.buyer_id === userId
  const counterpartyId = isBuyer ? order.seller_id : order.buyer_id
  const isCounterpartyOnline = useIsUserOnline(counterpartyId)
  const escrowQuery = useEscrow(order.id)
  const escrow = escrowQuery.data
  const fulfillmentStatus = deriveFulfillmentStatus(order, escrow)
  const fulfillmentMeta = fulfillmentStatusMeta(fulfillmentStatus)

  const canComplete = order.status === "pending" && isBuyer && !escrow
  const canCancel =
    order.status === "pending" &&
    (!escrow || escrow.status === "awaiting_funding")

  return (
    <Box
      key={order.id}
      bg="white"
      borderRadius="2xl"
      p={6}
      boxShadow="0 4px 25px rgba(0,0,0,0.04)"
      border="1px solid"
      borderColor="gray.100"
      _hover={{
        boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
        borderColor: "blue.200",
        transform: "translateY(-3px)",
      }}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    >
      {/* Top row: price + status + escrow badge */}
      <Flex justify="space-between" align="center" mb={3} wrap="wrap" gap={2}>
        <Flex align="center" gap={3}>
          <Text fontWeight="800" fontSize="xl" color="blue.600">
            {formatCurrencyVnd(order.final_price)}
          </Text>
          <Badge
            colorPalette={status.color as any}
            variant="surface"
            size="md"
            borderRadius="full"
            px={3}
          >
            {status.label}
          </Badge>
          {escrow && escrow.status !== "awaiting_funding" && (
            <Badge
              colorPalette="orange"
              variant="surface"
              borderRadius="full"
              px={2}
              size="sm"
            >
              <FiShield
                size={10}
                style={{ marginRight: "3px", display: "inline" }}
              />
              Escrow
            </Badge>
          )}
        </Flex>
        <HStack gap={2}>
          <Button
            size="sm"
            variant="ghost"
            colorPalette="blue"
            borderRadius="lg"
            onClick={() => navigate({ to: "/chat" })}
          >
            <FiMessageSquare size={14} style={{ marginRight: "4px" }} />
            Nhắn tin
          </Button>
        </HStack>
      </Flex>

      {/* Order status tracker */}
      <OrderStatusTracker
        fulfillmentStatus={fulfillmentStatus}
        hasEscrow={!!escrow}
      />

      <HStack mt={2} gap={2}>
        <Badge
          colorPalette={fulfillmentMeta.color as any}
          variant="subtle"
          borderRadius="full"
          px={3}
          size="sm"
        >
          {fulfillmentMeta.label}
        </Badge>
      </HStack>

      {/* Counterparty + ID */}
      <Flex mt={2} justify="space-between" align="center" wrap="wrap" gap={2}>
        <HStack fontSize="xs" color="gray.500" gap={3}>
          <Text>
            Mã:{" "}
            <Text as="span" fontFamily="mono" color="gray.400">
              {order.id.substring(0, 8)}...
            </Text>
          </Text>
          <Badge
            colorPalette={isCounterpartyOnline ? "green" : "gray"}
            variant="subtle"
            borderRadius="full"
            px={2}
            size="sm"
          >
            Đối tác:{" "}
            {isCounterpartyOnline ? (
              <>
                <Box
                  as="span"
                  display="inline-block"
                  w={2}
                  h={2}
                  bg="green.500"
                  borderRadius="full"
                  mr={1.5}
                />{" "}
                Online
              </>
            ) : (
              <>
                <Box
                  as="span"
                  display="inline-block"
                  w={2}
                  h={2}
                  bg="gray.400"
                  borderRadius="full"
                  mr={1.5}
                />{" "}
                Offline
              </>
            )}
          </Badge>
        </HStack>

        <HStack gap={2}>
          <Button
            size="sm"
            variant="surface"
            colorPalette="blue"
            borderRadius="lg"
            onClick={() =>
              navigate({ to: "/orders/$id", params: { id: order.id } })
            }
          >
            Chi tiết
          </Button>
          {canComplete && (
            <Button
              size="sm"
              colorPalette="green"
              borderRadius="lg"
              onClick={() => onComplete(order.id)}
              loading={completePending}
            >
              Hoàn thành
            </Button>
          )}
          {canCancel && (
            <Button
              size="sm"
              colorPalette="red"
              variant="outline"
              borderRadius="lg"
              onClick={() => onCancel(order.id)}
              loading={cancelPending}
            >
              Hủy
            </Button>
          )}
        </HStack>
      </Flex>

      {order.status === "pending" &&
        escrow &&
        escrow.status !== "awaiting_funding" && (
          <Text
            mt={2}
            fontSize="xs"
            color="orange.600"
            bg="orange.50"
            px={3}
            py={1.5}
            borderRadius="lg"
          >
            <FiShield
              size={12}
              style={{ display: "inline", marginRight: "4px" }}
            />
            Đơn dùng escrow — vào chi tiết đơn để xử lý release/dispute.
          </Text>
        )}
    </Box>
  )
}

export function OrdersPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()
  const [tab, setTab] = useState<OrderTab>("buying")

  const ordersQuery = useMyOrders()
  const completeMutation = useCompleteOrder()
  const cancelMutation = useCancelOrder()

  const allOrders = ordersQuery.data ?? []
  const filteredOrders = useMemo(() => {
    if (tab === "buying") {
      return allOrders.filter((order) => order.buyer_id === user?.id)
    }
    if (tab === "selling") {
      return allOrders.filter((order) => order.seller_id === user?.id)
    }
    return allOrders
  }, [allOrders, tab, user?.id])

  const orderStats = useMemo(() => {
    return {
      total: allOrders.length,
      pending: allOrders.filter((o) => o.status === "pending").length,
      completed: allOrders.filter((o) => o.status === "completed").length,
    }
  }, [allOrders])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: "/auth/login" })
    }
  }, [authLoading, isAuthenticated, navigate])

  if (!authLoading && !isAuthenticated) {
    return null
  }

  if (authLoading || !user) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

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
      <Container
        maxW="1440px"
        mx="auto"
        px={{ base: "1rem", md: "2%" }}
        py={10}
      >
        <Flex align="center" mb={6} gap={3}>
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
        </Flex>

        <Heading
          size="3xl"
          mb={2}
          color="gray.900"
          fontWeight="extrabold"
          display="flex"
          alignItems="center"
        >
          <FiShoppingCart
            size={32}
            style={{ display: "inline", marginRight: "12px" }}
          />
          Đơn hàng của tôi
        </Heading>
        <Text color="gray.500" fontSize="md" mb={6}>
          Quản lý các giao dịch mua và bán một cách nhanh chóng.
        </Text>

        {/* Stat Cards */}
        <SimpleGrid columns={{ base: 3 }} gap={4} mb={6}>
          <div className="stat-card animate-fadeinup delay-0">
            <div className="stat-card-icon" style={{ background: "#EFF6FF" }}>
              <FiShoppingCart size={18} color="#2563eb" />
            </div>
            <div className="stat-card-value">{orderStats.total}</div>
            <div className="stat-card-label">Tổng đơn</div>
          </div>
          <div className="stat-card animate-fadeinup delay-1">
            <div className="stat-card-icon" style={{ background: "#FFFBEB" }}>
              <FiClock size={18} color="#f59e0b" />
            </div>
            <div className="stat-card-value" style={{ color: "#f59e0b" }}>
              {orderStats.pending}
            </div>
            <div className="stat-card-label">Đang xử lý</div>
          </div>
          <div className="stat-card animate-fadeinup delay-2">
            <div className="stat-card-icon" style={{ background: "#F0FDF4" }}>
              <FiCheckCircle size={18} color="#10b981" />
            </div>
            <div className="stat-card-value" style={{ color: "#10b981" }}>
              {orderStats.completed}
            </div>
            <div className="stat-card-label">Hoàn thành</div>
          </div>
        </SimpleGrid>

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
                onClick={() => navigate({ to: "/" })}
                size="lg"
                px={8}
                borderRadius="xl"
                className="btn-shine"
                boxShadow="0 4px 15px rgba(37,99,235,0.35)"
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "white",
                  position: "relative",
                  overflow: "hidden",
                  border: "none",
                }}
                _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                transition="all 0.2s"
              >
                Tiếp tục mua hàng
              </Button>
            </VStack>
          </Box>
        ) : (
          <VStack align="stretch" gap={5}>
            {filteredOrders.map((order) => {
              return (
                <OrderListItem
                  key={order.id}
                  order={order}
                  userId={user.id}
                  navigate={navigate}
                  completePending={completeMutation.isPending}
                  cancelPending={cancelMutation.isPending}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                />
              )
            })}
          </VStack>
        )}
      </Container>
    </Box>
  )
}
