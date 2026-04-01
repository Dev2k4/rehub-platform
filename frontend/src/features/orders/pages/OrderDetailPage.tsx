import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { FiArrowLeft, FiCreditCard, FiShield } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { toaster } from "@/components/ui/toaster"
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
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"
import {
  useCancelOrder,
  useCompleteOrder,
  useOrder,
} from "@/features/orders/hooks/useOrders"
import { ReviewForm } from "@/features/reviews/components/ReviewForm"
import { ReviewsList } from "@/features/reviews/components/ReviewsList"
import { useOrderReviews } from "@/features/reviews/hooks/useReviews"
import { useIsUserOnline } from "@/features/shared/realtime/ws.provider"

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

function escrowStatusLabel(status: string): string {
  switch (status) {
    case "awaiting_funding":
      return "Chờ nạp tiền"
    case "held":
      return "Đang giữ"
    case "release_pending":
      return "Chờ xác nhận"
    case "released":
      return "Đã thanh toán"
    case "disputed":
      return "Tranh chấp"
    case "refunded":
      return "Đã hoàn tiền"
    default:
      return status
  }
}

export function OrderDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: "/orders/$id" })
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()

  const orderQuery = useOrder(id)
  const orderReviewsQuery = useOrderReviews(id)
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
  const counterpartyId = isBuyer ? order.seller_id : order.buyer_id
  const isCounterpartyOnline = useIsUserOnline(counterpartyId)
  const escrow = escrowQuery.data
  const hasEscrow = !!escrow
  const canComplete = !hasEscrow && order.status === "pending" && isBuyer
  const canCancel = !hasEscrow && order.status === "pending"

  const walletAvailable = Number(walletQuery.data?.available_balance ?? 0)
  const escrowAmount = Number(escrow?.amount ?? 0)
  const topupAmountNeeded = Math.max(
    0,
    Number((escrowAmount - walletAvailable).toFixed(2)),
  )

  const canFundEscrow =
    hasEscrow && isBuyer && escrow?.status === "awaiting_funding"
  const canRequestRelease = hasEscrow && isSeller && escrow?.status === "held"
  const canConfirmRelease =
    hasEscrow && isBuyer && escrow?.status === "release_pending"
  const canOpenDispute =
    hasEscrow &&
    (escrow?.status === "held" || escrow?.status === "release_pending")
  const alreadyReviewed = (orderReviewsQuery.data ?? []).some(
    (review) => review.reviewer_id === user.id,
  )
  const canReview =
    order.status === "completed" && (isBuyer || isSeller) && !alreadyReviewed

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="3xl" py={10} mx="auto">
        {/* Top Navigation */}
        <HStack mb={6} gap={3}>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/orders" })}
            color="blue.600"
            borderRadius="xl"
            _hover={{ bg: "blue.50" }}
          >
            <FiArrowLeft style={{ marginRight: "0.5rem" }} />
            Quay lại danh sách đơn
          </Button>
          <Button
            variant="outline"
            colorPalette="blue"
            onClick={() => navigate({ to: "/wallet" })}
            borderRadius="xl"
          >
            <FiCreditCard style={{ marginRight: "0.5rem" }} />
            Xem ví demo
          </Button>
        </HStack>

        {/* Main Order Card */}
        <Box
          bg="whiteAlpha.800"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          p={8}
          boxShadow="0 10px 40px rgba(0,0,0,0.06)"
          border="1px"
          borderColor="whiteAlpha.400"
        >
          {/* Header */}
          <Flex
            justify="space-between"
            align="start"
            mb={6}
            direction={{ base: "column", sm: "row" }}
            gap={4}
          >
            <Box>
              <Heading size="xl" mb={2} color="gray.900">
                Chi tiết đơn hàng
              </Heading>
              <Text color="gray.500">Thông tin chi tiết về giao dịch này.</Text>
            </Box>
            <Badge
              colorPalette={status.color as any}
              size="lg"
              variant="subtle"
              px={4}
              py={1.5}
              borderRadius="full"
              fontWeight="semibold"
            >
              {status.label}
            </Badge>
          </Flex>

          {/* Order Info Card */}
          <Box
            bg="gray.50"
            p={6}
            borderRadius="xl"
            border="1px"
            borderColor="gray.100"
            mb={2}
          >
            <VStack align="stretch" gap={0}>
              <HStack justify="space-between" py={3}>
                <Text color="gray.500" fontSize="sm">
                  Mã đơn hàng
                </Text>
                <Text
                  fontWeight="medium"
                  fontFamily="mono"
                  color="gray.700"
                  fontSize="xs"
                  wordBreak="break-all"
                  maxW="55%"
                  textAlign="right"
                >
                  {order.id}
                </Text>
              </HStack>
              <Separator borderColor="gray.200" />
              <HStack justify="space-between" py={3}>
                <Text color="gray.500" fontSize="sm">
                  Thời gian tạo
                </Text>
                <Text fontWeight="medium" color="gray.800" fontSize="sm">
                  {new Date(order.created_at).toLocaleString("vi-VN")}
                </Text>
              </HStack>
              <Separator borderColor="gray.200" />
              <HStack justify="space-between" py={3}>
                <Text color="gray.500" fontSize="sm">
                  Vai trò của bạn
                </Text>
                <Badge
                  colorPalette={isBuyer ? "blue" : "green"}
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                >
                  {isBuyer
                    ? "Người mua"
                    : isSeller
                      ? "Người bán"
                      : "Không xác định"}
                </Badge>
              </HStack>
              <Separator borderColor="gray.200" />
                <HStack justify="space-between" py={3}>
                  <Text color="gray.500" fontSize="sm">
                    Đối tác giao dịch
                  </Text>
                  <HStack gap={2} maxW="60%" justify="end" flexWrap="wrap">
                    <Text
                      fontSize="xs"
                      color="gray.700"
                      fontFamily="mono"
                      wordBreak="break-all"
                      textAlign="right"
                    >
                      {counterpartyId}
                    </Text>
                    <Badge
                      colorPalette={isCounterpartyOnline ? "green" : "gray"}
                      variant="subtle"
                      borderRadius="full"
                      px={2}
                    >
                      {isCounterpartyOnline ? "Đang online" : "Đang offline"}
                    </Badge>
                  </HStack>
                </HStack>
                <Separator borderColor="gray.200" />
              <HStack justify="space-between" py={4} mt={1}>
                <Text color="gray.800" fontWeight="bold" fontSize="md">
                  TỔNG GIÁ TRỊ
                </Text>
                <Text color="blue.600" fontWeight="bold" fontSize="2xl">
                  {formatCurrencyVnd(order.final_price)}
                </Text>
              </HStack>
            </VStack>
          </Box>

          {/* Escrow Section */}
          {hasEscrow && (
            <Box
              mt={6}
              p={6}
              borderRadius="xl"
              border="1px"
              borderColor="blue.200"
              bg="blue.50"
              boxShadow="0 4px 20px rgba(66,153,225,0.1)"
            >
              <HStack mb={4} gap={2}>
                <FiShield color="#2563EB" size={20} />
                <Heading size="md" color="blue.900">
                  Escrow Demo Flow
                </Heading>
              </HStack>

              <VStack align="stretch" gap={0}>
                <HStack justify="space-between" py={2.5}>
                  <Text color="blue.700" fontSize="sm">
                    Trạng thái Escrow
                  </Text>
                  <Badge
                    colorPalette="blue"
                    variant="surface"
                    borderRadius="full"
                    px={3}
                  >
                    {escrowStatusLabel(escrow?.status ?? "")}
                  </Badge>
                </HStack>
                <Separator borderColor="blue.200" />
                <HStack justify="space-between" py={2.5}>
                  <Text color="blue.700" fontSize="sm">
                    Số tiền đang giữ
                  </Text>
                  <Text fontWeight="bold" color="blue.900">
                    {formatCurrencyVnd(escrow?.amount ?? "0")}
                  </Text>
                </HStack>
                <Separator borderColor="blue.200" />
                <HStack justify="space-between" py={2.5}>
                  <Text color="blue.700" fontSize="sm">
                    Số dư ví demo của bạn
                  </Text>
                  <Text fontWeight="medium" color="blue.800">
                    {formatCurrencyVnd(
                      walletQuery.data?.available_balance ?? "0",
                    )}
                  </Text>
                </HStack>
              </VStack>

              <HStack mt={5} wrap="wrap" gap={3}>
                {canFundEscrow && topupAmountNeeded > 0 && (
                  <Button
                    size="sm"
                    colorPalette="blue"
                    variant="outline"
                    borderRadius="xl"
                    onClick={async () => {
                      try {
                        await topupMutation.mutateAsync(topupAmountNeeded)
                        toaster.create({
                          title: `Nạp thành công ${formatCurrencyVnd(String(topupAmountNeeded))}`,
                          type: "success",
                        })
                      } catch (e: any) {
                        toaster.create({
                          title: e?.message || "Lỗi nạp ví",
                          type: "error",
                        })
                      }
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
                    borderRadius="xl"
                    onClick={async () => {
                      try {
                        await fundEscrowMutation.mutateAsync(order.id)
                        toaster.create({
                          title: "Đã nạp tiền vào Escrow",
                          type: "success",
                        })
                      } catch (e: any) {
                        toaster.create({
                          title: e?.message || "Lỗi nạp tiền Escrow",
                          type: "error",
                        })
                      }
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
                    borderRadius="xl"
                    onClick={async () => {
                      try {
                        await releaseRequestMutation.mutateAsync(order.id)
                        toaster.create({
                          title: "Đã yêu cầu thả tiền",
                          type: "success",
                        })
                      } catch (e: any) {
                        toaster.create({
                          title: e?.message || "Lỗi yêu cầu thả tiền",
                          type: "error",
                        })
                      }
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
                    borderRadius="xl"
                    onClick={async () => {
                      try {
                        await confirmReleaseMutation.mutateAsync(order.id)
                        toaster.create({
                          title: "Đã xác nhận thanh toán",
                          type: "success",
                        })
                      } catch (e: any) {
                        const message = String(e?.message || "")
                        if (message.includes("Cannot confirm release in released state")) {
                          await Promise.all([
                            escrowQuery.refetch(),
                            orderQuery.refetch(),
                            walletQuery.refetch(),
                          ])
                          toaster.create({
                            title: "Escrow đã được xác nhận trước đó",
                            type: "info",
                          })
                          return
                        }

                        toaster.create({
                          title: message || "Lỗi xác nhận",
                          type: "error",
                        })
                      }
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
                    borderRadius="xl"
                    onClick={async () => {
                      try {
                        await disputeMutation.mutateAsync({
                          orderId: order.id,
                          note: "Opened from order detail page",
                        })
                        toaster.create({
                          title: "Đã mở tranh chấp",
                          type: "warning",
                        })
                      } catch (e: any) {
                        toaster.create({
                          title: e?.message || "Lỗi tạo tranh chấp",
                          type: "error",
                        })
                      }
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

          {/* Action Buttons */}
          {(canComplete || canCancel) && (
            <HStack mt={6} gap={3}>
              {canComplete && (
                <Button
                  colorPalette="green"
                  borderRadius="xl"
                  onClick={async () => {
                    try {
                      await completeMutation.mutateAsync(order.id)
                      toaster.create({
                        title: "Hoàn thành đơn thành công",
                        type: "success",
                      })
                    } catch (e: any) {
                      toaster.create({
                        title: e?.message || "Lỗi hoàn thành",
                        type: "error",
                      })
                    }
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
                  borderRadius="xl"
                  onClick={async () => {
                    try {
                      await cancelMutation.mutateAsync(order.id)
                      toaster.create({
                        title: "Hủy đơn thành công",
                        type: "info",
                      })
                    } catch (e: any) {
                      toaster.create({
                        title: e?.message || "Lỗi hủy đơn",
                        type: "error",
                      })
                    }
                  }}
                  loading={cancelMutation.isPending}
                >
                  Hủy đơn
                </Button>
              )}
            </HStack>
          )}

          {/* Reviews Section */}
          <Box mt={6} pt={6} borderTop="1px" borderColor="gray.200">
            <Heading size="md" mb={4} color="gray.900">
              Đánh giá giao dịch
            </Heading>

            {canReview ? (
              <Box mb={6}>
                <ReviewForm orderId={order.id} />
              </Box>
            ) : (
              <Text fontSize="sm" color="gray.500" mb={4}>
                {order.status !== "completed"
                  ? "Bạn có thể đánh giá sau khi giao dịch hoàn tất."
                  : "Bạn đã chia sẻ đánh giá cho giao dịch này."}
              </Text>
            )}

            <ReviewsList
              reviews={orderReviewsQuery.data ?? []}
              isLoading={orderReviewsQuery.isLoading}
              emptyText="Chưa có đánh giá nào."
            />
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
