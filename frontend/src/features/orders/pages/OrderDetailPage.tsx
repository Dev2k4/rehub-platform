import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { FiArrowLeft, FiCreditCard, FiShield } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { toaster } from "@/components/ui/toaster";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import {
  useBuyerConfirmReceived,
  useFulfillment,
  useMarkShipping,
  useMarkDelivered,
  useStartPreparing,
} from "@/features/fulfillment/hooks/useFulfillment";
import {
  useDemoTopupWallet,
  useEscrow,
  useFundEscrow,
  useOpenEscrowDispute,
  useWallet,
} from "@/features/escrow/hooks/useEscrow";
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils";
import {
  useCancelOrder,
  useCompleteOrder,
  useOrder,
} from "@/features/orders/hooks/useOrders";
import { ReviewForm } from "@/features/reviews/components/ReviewForm";
import { ReviewsList } from "@/features/reviews/components/ReviewsList";
import { useOrderReviews } from "@/features/reviews/hooks/useReviews";
import { useIsUserOnline } from "@/features/shared/realtime/ws.provider";
import { getUserPublicProfile } from "@/features/users/api/users.api";

function statusMeta(status: string): { label: string; color: string } {
  switch (status) {
    case "pending":
      return { label: "Chờ xử lý", color: "yellow" };
    case "preparing":
      return { label: "Chuẩn bị hàng", color: "purple" };
    case "in_delivery":
      return { label: "Đang giao", color: "blue" };
    case "delivered":
      return { label: "Đã giao", color: "orange" };
    case "completed":
      return { label: "Hoàn thành", color: "green" };
    case "cancelled":
      return { label: "Đã hủy", color: "red" };
    default:
      return { label: status, color: "gray" };
  }
}

function fulfillmentStatusLabel(status: string | undefined): string {
  switch (status) {
    case "pending_seller_start":
      return "Chờ người bán bắt đầu";
    case "preparing":
      return "Đang chuẩn bị hàng";
    case "in_delivery":
      return "Đang giao hàng";
    case "delivered_by_seller":
      return "Người bán đã giao";
    case "buyer_confirmed_received":
      return "Người mua đã xác nhận nhận hàng";
    default:
      return "Chờ cập nhật";
  }
}

function escrowStatusLabel(status: string): string {
  switch (status) {
    case "awaiting_funding":
      return "Chờ nạp tiền";
    case "held":
      return "Đang giữ";
    case "release_pending":
      return "Chờ xác nhận";
    case "released":
      return "Đã thanh toán";
    case "disputed":
      return "Tranh chấp";
    case "refunded":
      return "Đã hoàn tiền";
    default:
      return status;
  }
}

export function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: "/orders/$id" });
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser();

  const orderQuery = useOrder(id);
  const orderReviewsQuery = useOrderReviews(id);
  const completeMutation = useCompleteOrder();
  const cancelMutation = useCancelOrder();
  const escrowQuery = useEscrow(id);
  const walletQuery = useWallet();
  const topupMutation = useDemoTopupWallet();
  const fundEscrowMutation = useFundEscrow();
  const fulfillmentQuery = useFulfillment(id);
  const startPreparingMutation = useStartPreparing();
  const markShippingMutation = useMarkShipping();
  const markDeliveredMutation = useMarkDelivered();
  const buyerConfirmMutation = useBuyerConfirmReceived();
  const disputeMutation = useOpenEscrowDispute();
  const [sellerProofUrl, setSellerProofUrl] = useState("");
  const [buyerProofUrl, setBuyerProofUrl] = useState("");
  const counterpartyId =
    orderQuery.data && user
      ? orderQuery.data.buyer_id === user.id
        ? orderQuery.data.seller_id
        : orderQuery.data.buyer_id
      : "";
  const counterpartyProfileQuery = useQuery({
    queryKey: ["seller-profile", counterpartyId],
    queryFn: () => getUserPublicProfile(counterpartyId),
    enabled: !!counterpartyId,
  });
  const isCounterpartyOnline = useIsUserOnline(
    orderQuery.data
      ? orderQuery.data.buyer_id === user?.id
        ? orderQuery.data.seller_id
        : orderQuery.data.buyer_id
      : null,
  );

  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" });
    return null;
  }

  if (authLoading || !user || orderQuery.isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <Container py={10}>
        <Text color="red.600">Không thể tải chi tiết đơn hàng.</Text>
      </Container>
    );
  }

  const order = orderQuery.data;
  const status = statusMeta(order.status);
  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.seller_id === user.id;
  const counterpartyName =
    counterpartyProfileQuery.data?.full_name?.trim() || counterpartyId;
  const escrow = escrowQuery.data;
  const hasEscrow = !!escrow;
  const fulfillment = fulfillmentQuery.data;
  const canComplete = !hasEscrow && order.status === "pending" && isBuyer;
  const canCancel = !hasEscrow && order.status === "pending";

  const walletAvailable = Number(walletQuery.data?.available_balance ?? 0);
  const escrowAmount = Number(escrow?.amount ?? 0);
  const topupAmountNeeded = Math.max(
    0,
    Number((escrowAmount - walletAvailable).toFixed(2)),
  );

  const canFundEscrow =
    hasEscrow && isBuyer && escrow?.status === "awaiting_funding";
  const canStartPreparing =
    !!fulfillment &&
    isSeller &&
    fulfillment.status === "pending_seller_start" &&
    (!hasEscrow || escrow?.status === "held");
  const canMarkShipping =
    !!fulfillment && isSeller && fulfillment.status === "preparing";
  const canMarkDelivered =
    !!fulfillment && isSeller && fulfillment.status === "in_delivery";
  const canBuyerConfirmReceived =
    isBuyer &&
    (
      fulfillment?.status === "delivered_by_seller" ||
      ((order.status as string) === "delivered" && escrow?.status === "release_pending")
    );
  const canOpenDispute =
    hasEscrow &&
    escrow?.status === "release_pending" &&
    fulfillment?.status === "delivered_by_seller";
  const alreadyReviewed = (orderReviewsQuery.data ?? []).some(
    (review) => review.reviewer_id === user.id,
  );
  const hasCounterparty = counterpartyId !== user.id;
  const canReview =
    order.status === "completed" &&
    hasCounterparty &&
    isBuyer &&
    !alreadyReviewed;
  const paymentModeLabel = hasEscrow
    ? "Escrow bảo chứng"
    : "Thanh toán trực tiếp";
  const buyerActionHint = (() => {
    if (!isBuyer) {
      return null;
    }

    if (hasEscrow && escrow?.status === "awaiting_funding") {
      return "Bạn cần nạp tiền vào escrow để người bán có thể bắt đầu giao hàng.";
    }
    if (fulfillment?.status === "pending_seller_start") {
      return "Chờ người bán xác nhận bắt đầu giao hàng.";
    }
    if (fulfillment?.status === "preparing") {
      return "Người bán đang chuẩn bị hàng.";
    }
    if (fulfillment?.status === "in_delivery") {
      return "Đơn đang trong quá trình giao hàng.";
    }
    if (fulfillment?.status === "delivered_by_seller") {
      return "Người bán đã đánh dấu đã giao. Hãy xác nhận đã nhận hàng kèm ảnh bằng chứng.";
    }
    if ((order.status as string) === "delivered" && escrow?.status === "release_pending") {
      return "Đơn đã được đánh dấu đã giao. Hãy xác nhận đã nhận hàng để hoàn tất thanh toán.";
    }
    if (fulfillment?.status === "buyer_confirmed_received") {
      return "Bạn đã xác nhận đã nhận hàng.";
    }
    if (order.status === "pending") {
      return "Đơn hàng đang xử lý. Bạn có thể theo dõi tiến độ theo thời gian thực.";
    }
    if (order.status === "completed") {
      return "Đơn hàng đã hoàn tất. Bạn có thể để lại đánh giá cho người bán.";
    }
    if (order.status === "cancelled") {
      return "Đơn hàng đã bị hủy. Bạn có thể quay lại marketplace để chọn sản phẩm khác.";
    }
    return "Theo dõi cập nhật trạng thái để biết bước tiếp theo của giao dịch.";
  })();

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
                    fontSize="sm"
                    color="blue.600"
                    cursor="pointer"
                    wordBreak="break-all"
                    textAlign="right"
                    onClick={() =>
                      navigate({
                        to: "/sellers/$id",
                        params: { id: counterpartyId },
                      })
                    }
                  >
                    {counterpartyName}
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

          {isBuyer && buyerActionHint && (
            <Box
              mt={6}
              p={5}
              borderRadius="xl"
              border="1px"
              borderColor="blue.100"
              bg="blue.100"
            >
              <Heading size="sm" color="blue.900" mb={2}>
                Trạng thái giao dịch
              </Heading>
              <Text fontSize="sm" color="blue.800" mb={3}>
                {buyerActionHint}
              </Text>
              <HStack gap={2} flexWrap="wrap">
                <Badge
                  colorPalette="blue"
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                >
                  {paymentModeLabel}
                </Badge>
                <Badge
                  colorPalette={status.color as any}
                  variant="subtle"
                  borderRadius="full"
                  px={3}
                >
                  {status.label}
                </Badge>
              </HStack>
            </Box>
          )}

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
                  {isSeller ? "Tiến độ giao hàng" : "Quy trình Escrow"}
                </Heading>
              </HStack>

              <VStack align="stretch" gap={0}>
                <HStack justify="space-between" py={2.5}>
                  <Text color="blue.700" fontSize="sm">
                    {isSeller ? "Trạng thái giao hàng" : "Trạng thái Escrow"}
                  </Text>
                  <Badge
                    colorPalette="blue"
                    variant="surface"
                    borderRadius="full"
                    px={3}
                  >
                    {isSeller
                      ? fulfillmentStatusLabel(fulfillment?.status)
                      : escrowStatusLabel(escrow?.status ?? "")}
                  </Badge>
                </HStack>
                <Separator borderColor="blue.200" />
                {isBuyer && (
                  <>
                    <HStack justify="space-between" py={2.5}>
                      <Text color="blue.700" fontSize="sm">
                        Số tiền đang giữ
                      </Text>
                      <Text fontWeight="bold" color="blue.900">
                        {formatCurrencyVnd(escrow?.amount ?? "0")}
                      </Text>
                    </HStack>
                    <Separator borderColor="blue.200" />
                  </>
                )}
                <HStack justify="space-between" py={2.5}>
                  <Text color="blue.700" fontSize="sm">
                    {isBuyer ? "Số dư ví demo của bạn" : "Tiền đã được người mua ký quỹ"}
                  </Text>
                  {isBuyer ? (
                    <Text fontWeight="medium" color="blue.800">
                      {formatCurrencyVnd(
                        walletQuery.data?.available_balance ?? "0",
                      )}
                    </Text>
                  ) : (
                    <Badge
                      colorPalette={escrow?.status === "held" || escrow?.status === "release_pending" || escrow?.status === "released" ? "green" : "gray"}
                      variant="subtle"
                      borderRadius="full"
                      px={3}
                    >
                      {escrow?.status === "held" || escrow?.status === "release_pending" || escrow?.status === "released"
                        ? "Người mua đã gửi tiền"
                        : "Chưa gửi tiền"}
                    </Badge>
                  )}
                </HStack>
              </VStack>

              <HStack mt={5} wrap="wrap" gap={3}>
                {isBuyer && canFundEscrow && topupAmountNeeded > 0 && (
                  <Button
                    size="sm"
                    colorPalette="blue"
                    variant="outline"
                    borderRadius="xl"
                    onClick={async () => {
                      try {
                        await topupMutation.mutateAsync(topupAmountNeeded);
                        toaster.create({
                          title: `Nạp thành công ${formatCurrencyVnd(String(topupAmountNeeded))}`,
                          type: "success",
                        });
                      } catch (e: any) {
                        toaster.create({
                          title: e?.message || "Lỗi nạp ví",
                          type: "error",
                        });
                      }
                    }}
                    loading={topupMutation.isPending}
                  >
                    Nạp ví demo {formatCurrencyVnd(String(topupAmountNeeded))}
                  </Button>
                )}

                {isBuyer && canFundEscrow && (
                  <Button
                    size="sm"
                    colorPalette="blue"
                    borderRadius="xl"
                    onClick={async () => {
                      try {
                        await fundEscrowMutation.mutateAsync(order.id);
                        toaster.create({
                          title: "Đã nạp tiền vào Escrow",
                          type: "success",
                        });
                      } catch (e: any) {
                        toaster.create({
                          title: e?.message || "Lỗi nạp tiền Escrow",
                          type: "error",
                        });
                      }
                    }}
                    loading={fundEscrowMutation.isPending}
                    disabled={walletAvailable < escrowAmount}
                  >
                    Nạp tiền Escrow
                  </Button>
                )}

                {canStartPreparing && (
                  <Button
                    size="sm"
                    colorPalette="orange"
                    borderRadius="xl"
                    onClick={async () => {
                      try {
                        await startPreparingMutation.mutateAsync(order.id);
                        toaster.create({
                          title: "Đã cập nhật: đang chuẩn bị hàng",
                          type: "success",
                        });
                      } catch (e: any) {
                        toaster.create({
                          title: e?.message || "Lỗi cập nhật trạng thái chuẩn bị",
                          type: "error",
                        });
                      }
                    }}
                    loading={startPreparingMutation.isPending}
                  >
                    Đang chuẩn bị hàng
                  </Button>
                )}

                {canMarkShipping && (
                  <Button
                    size="sm"
                    colorPalette="blue"
                    borderRadius="xl"
                    onClick={async () => {
                      try {
                        await markShippingMutation.mutateAsync({
                          orderId: order.id,
                        });
                        toaster.create({
                          title: "Đã cập nhật: đang giao hàng",
                          type: "success",
                        });
                      } catch (e: any) {
                        toaster.create({
                          title: e?.message || "Lỗi cập nhật trạng thái giao hàng",
                          type: "error",
                        });
                      }
                    }}
                    loading={markShippingMutation.isPending}
                  >
                    Đang giao hàng
                  </Button>
                )}

                {canMarkDelivered && (
                  <>
                    <Input
                      value={sellerProofUrl}
                      onChange={(e) => setSellerProofUrl(e.target.value)}
                      placeholder="Link ảnh bằng chứng giao hàng (seller)"
                      size="sm"
                      maxW="360px"
                      bg="white"
                    />
                    <Button
                      size="sm"
                      colorPalette="orange"
                      borderRadius="xl"
                      onClick={async () => {
                        if (!sellerProofUrl.trim()) {
                          toaster.create({
                            title: "Bạn cần cung cấp ảnh bằng chứng giao hàng",
                            type: "error",
                          });
                          return;
                        }
                        try {
                          await markDeliveredMutation.mutateAsync({
                            orderId: order.id,
                            proofImageUrls: [sellerProofUrl.trim()],
                          });
                          toaster.create({
                            title: "Đã đánh dấu đã giao hàng",
                            type: "success",
                          });
                        } catch (e: any) {
                          toaster.create({
                            title: e?.message || "Lỗi đánh dấu đã giao",
                            type: "error",
                          });
                        }
                      }}
                      loading={markDeliveredMutation.isPending}
                    >
                      Đã giao hàng
                    </Button>
                  </>
                )}

                {canBuyerConfirmReceived && (
                  <>
                    <Input
                      value={buyerProofUrl}
                      onChange={(e) => setBuyerProofUrl(e.target.value)}
                      placeholder="Link ảnh bằng chứng đã nhận (buyer)"
                      size="sm"
                      maxW="360px"
                      bg="white"
                    />
                    <Button
                      size="sm"
                      colorPalette="green"
                      borderRadius="xl"
                      onClick={async () => {
                        if (!buyerProofUrl.trim()) {
                          toaster.create({
                            title: "Bạn cần cung cấp ảnh bằng chứng đã nhận",
                            type: "error",
                          });
                          return;
                        }
                        try {
                          await buyerConfirmMutation.mutateAsync({
                            orderId: order.id,
                            proofImageUrls: [buyerProofUrl.trim()],
                          });
                          toaster.create({
                            title: "Đã xác nhận đã nhận hàng",
                            type: "success",
                          });
                        } catch (e: any) {
                          toaster.create({
                            title: e?.message || "Lỗi xác nhận đã nhận hàng",
                            type: "error",
                          });
                        }
                      }}
                      loading={buyerConfirmMutation.isPending}
                    >
                      Xác nhận đã nhận
                    </Button>
                  </>
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
                        });
                        toaster.create({
                          title: "Đã mở tranh chấp",
                          type: "warning",
                        });
                      } catch (e: any) {
                        toaster.create({
                          title: e?.message || "Lỗi tạo tranh chấp",
                          type: "error",
                        });
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
                      await completeMutation.mutateAsync(order.id);
                      toaster.create({
                        title: "Hoàn thành đơn thành công",
                        type: "success",
                      });
                    } catch (e: any) {
                      toaster.create({
                        title: e?.message || "Lỗi hoàn thành",
                        type: "error",
                      });
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
                      await cancelMutation.mutateAsync(order.id);
                      toaster.create({
                        title: "Hủy đơn thành công",
                        type: "info",
                      });
                    } catch (e: any) {
                      toaster.create({
                        title: e?.message || "Lỗi hủy đơn",
                        type: "error",
                      });
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
          <Box
            mt={6}
            p={6}
            borderRadius="xl"
            border="1px"
            borderColor="gray.100"
            bg="gray.200"
            boxShadow="0 4px 20px rgba(0,0,0,0.03)"
          >
            {isBuyer && (
              <Box mb={4}>
                <Heading size="sm" color="gray.900" mb={1}>
                  Đánh giá người bán
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Đánh giá sẽ giúp người mua khác có thêm thông tin trước khi
                  giao dịch.
                </Text>
              </Box>
            )}

            {canReview ? (
              <Box mb={6}>
                <ReviewForm orderId={order.id} />
              </Box>
            ) : null}

            <ReviewsList
              reviews={orderReviewsQuery.data ?? []}
              isLoading={orderReviewsQuery.isLoading}
              emptyText="Chưa có đánh giá nào."
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
