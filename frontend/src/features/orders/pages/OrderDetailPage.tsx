import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  Badge,
} from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { FiArrowLeft } from "react-icons/fi"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import {
  useConfirmEscrowRelease,
  useDemoTopupWallet,
  useEscrow,
  useFundEscrow,
  useOpenEscrowDispute,
  useRequestEscrowRelease,
  useWallet,
} from "@/features/escrow/hooks/useEscrow"
import {
  useOrder,
  useCompleteOrder,
  useCancelOrder,
} from "@/features/orders/hooks/useOrders"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"

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

export function OrderDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: "/orders/$id" })
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()

  const orderQuery = useOrder(id)
  const completeMutation = useCompleteOrder()
  const cancelMutation = useCancelOrder()
  const escrowQuery = useEscrow(id)
  const walletQuery = useWallet()
  const topupMutation = useDemoTopupWallet()
  const fundEscrowMutation = useFundEscrow()
  const releaseRequestMutation = useRequestEscrowRelease()
  const confirmReleaseMutation = useConfirmEscrowRelease()
  const disputeMutation = useOpenEscrowDispute()

  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" })
    return null
  }

  if (authLoading || !user || orderQuery.isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <Container py={10}>
        <Text color="red.600">Không thể tải chi tiết đơn hàng.</Text>
      </Container>
    )
  }

  const order = orderQuery.data
  const status = statusMeta(order.status)
  const isBuyer = order.buyer_id === user.id
  const isSeller = order.seller_id === user.id
  const escrow = escrowQuery.data
  const hasEscrow = !!escrow
  const canComplete = !hasEscrow && order.status === "pending" && isBuyer
  const canCancel = !hasEscrow && order.status === "pending"

  const walletAvailable = Number(walletQuery.data?.available_balance ?? 0)
  const escrowAmount = Number(escrow?.amount ?? 0)
  const topupAmountNeeded = Math.max(0, Number((escrowAmount - walletAvailable).toFixed(2)))

  const canFundEscrow = hasEscrow && isBuyer && escrow?.status === "awaiting_funding"
  const canRequestRelease = hasEscrow && isSeller && escrow?.status === "held"
  const canConfirmRelease = hasEscrow && isBuyer && escrow?.status === "release_pending"
  const canOpenDispute = hasEscrow && (escrow?.status === "held" || escrow?.status === "release_pending")

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="3xl" py={10}>
        <HStack mb={6}>
          <Button variant="ghost" onClick={() => navigate({ to: "/orders" })} color="blue.600">
            <FiArrowLeft style={{ marginRight: "0.5rem" }} />
            Quay lại danh sách đơn
          </Button>
          <Button variant="outline" colorPalette="blue" onClick={() => navigate({ to: "/wallet" })}>
            Xem ví demo
          </Button>
        </HStack>

        <Box bg="white" borderRadius="xl" p={6} boxShadow="sm" border="1px" borderColor="gray.200">
          <Heading size="md" mb={4}>Chi tiết đơn hàng</Heading>
          <Text mb={1}><b>Mã đơn:</b> {order.id}</Text>
          <Text mb={1}><b>Listing ID:</b> {order.listing_id}</Text>
          <Text mb={1}><b>Buyer ID:</b> {order.buyer_id}</Text>
          <Text mb={1}><b>Seller ID:</b> {order.seller_id}</Text>
          <Text mb={1}><b>Giá trị:</b> {formatCurrencyVnd(order.final_price)}</Text>
          <Text mb={3}><b>Tạo lúc:</b> {new Date(order.created_at).toLocaleString("vi-VN")}</Text>
          <Badge colorPalette={status.color as any}>{status.label}</Badge>

          {hasEscrow && (
            <Box mt={5} p={4} borderRadius="lg" bg="blue.50" border="1px" borderColor="blue.200">
              <Heading size="sm" mb={3}>Escrow Demo</Heading>
              <Text fontSize="sm" mb={1}><b>Trạng thái escrow:</b> {escrow?.status}</Text>
              <Text fontSize="sm" mb={1}><b>Số tiền giữ:</b> {formatCurrencyVnd(escrow?.amount ?? "0")}</Text>
              <Text fontSize="sm"><b>Ví khả dụng:</b> {formatCurrencyVnd(walletQuery.data?.available_balance ?? "0")}</Text>

              <HStack mt={4} wrap="wrap">
                {canFundEscrow && topupAmountNeeded > 0 && (
                  <Button
                    size="sm"
                    colorPalette="blue"
                    variant="outline"
                    onClick={async () => {
                      await topupMutation.mutateAsync(topupAmountNeeded)
                    }}
                    loading={topupMutation.isPending}
                  >
                    Nạp ví demo {formatCurrencyVnd(String(topupAmountNeeded))}
                  </Button>
                )}

                {canFundEscrow && (
                  <Button
                    size="sm"
                    colorPalette="blue"
                    onClick={async () => {
                      await fundEscrowMutation.mutateAsync(order.id)
                    }}
                    loading={fundEscrowMutation.isPending}
                    disabled={walletAvailable < escrowAmount}
                  >
                    Fund Escrow
                  </Button>
                )}

                {canRequestRelease && (
                  <Button
                    size="sm"
                    colorPalette="orange"
                    onClick={async () => {
                      await releaseRequestMutation.mutateAsync(order.id)
                    }}
                    loading={releaseRequestMutation.isPending}
                  >
                    Đánh dấu đã giao
                  </Button>
                )}

                {canConfirmRelease && (
                  <Button
                    size="sm"
                    colorPalette="green"
                    onClick={async () => {
                      await confirmReleaseMutation.mutateAsync(order.id)
                    }}
                    loading={confirmReleaseMutation.isPending}
                  >
                    Xác nhận nhận hàng
                  </Button>
                )}

                {canOpenDispute && (
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    onClick={async () => {
                      await disputeMutation.mutateAsync({
                        orderId: order.id,
                        note: "Opened from order detail page",
                      })
                    }}
                    loading={disputeMutation.isPending}
                  >
                    Mở tranh chấp
                  </Button>
                )}
              </HStack>

              {escrowQuery.isError && (
                <Text mt={3} fontSize="sm" color="red.600">
                  Không tải được thông tin escrow.
                </Text>
              )}
            </Box>
          )}

          <HStack mt={6}>
            {canComplete && (
              <Button
                colorPalette="green"
                onClick={async () => {
                  await completeMutation.mutateAsync(order.id)
                }}
                loading={completeMutation.isPending}
              >
                Hoàn thành đơn
              </Button>
            )}
            {canCancel && (
              <Button
                colorPalette="red"
                variant="outline"
                onClick={async () => {
                  await cancelMutation.mutateAsync(order.id)
                }}
                loading={cancelMutation.isPending}
              >
                Hủy đơn
              </Button>
            )}
          </HStack>
        </Box>
      </Container>
    </Box>
  )
}
