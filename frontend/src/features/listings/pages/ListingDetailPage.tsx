import {
  Badge,
  Box,
  Button,
  CloseButton,
  Container,
  Dialog,
  Flex,
  Heading,
  HStack,
  Image,
  Input,
  Portal,
  Separator,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiMessageCircle,
  FiShare2,
  FiStar,
  // FiTag,
  FiUser,
} from "react-icons/fi";
import type { CategoryTree } from "@/client";
import { ApiError } from "@/client";
import { toaster } from "@/components/ui/toaster";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import { openChatWidget } from "@/features/chat/chat-widget.events";
import {
  getCategoriesTree,
  getListings,
} from "@/features/home/api/marketplace.api";
import {
  flattenCategories,
  formatCurrencyVnd,
  formatPostedTime,
  getListingImageUrl,
} from "@/features/home/utils/marketplace.utils";
import { getListingDetails } from "@/features/listings/api/listings.api";
import { createOffer } from "@/features/offers/api/offers.api";
import { OfferDetailModal } from "@/features/offers/components/OfferDetailModal";
import { useOffersForListing } from "@/features/offers/hooks/useOffers";
import { createOrder } from "@/features/orders/api/orders.api";
import { useIsUserOnline } from "@/features/shared/realtime/ws.provider";
import {
  getSellerListings,
  getUserPublicProfile,
} from "@/features/users/api/users.api";
import { ListingCard } from "@/features/users/components/ListingCard";

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  brand_new: { label: "Mới 100%", color: "green" },
  like_new: { label: "Như mới", color: "teal" },
  good: { label: "Tốt", color: "blue" },
  fair: { label: "Khá", color: "yellow" },
  poor: { label: "Cũ", color: "gray" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Đang bán", color: "green" },
  pending: { label: "Chờ duyệt", color: "yellow" },
  sold: { label: "Đã bán", color: "gray" },
  hidden: { label: "Ẩn", color: "gray" },
  rejected: { label: "Bị từ chối", color: "red" },
};

const OFFER_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "yellow" },
  accepted: { label: "Đã chấp nhận", color: "green" },
  rejected: { label: "Đã từ chối", color: "red" },
  countered: { label: "Đã counter", color: "blue" },
  expired: { label: "Hết hạn", color: "gray" },
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const detail = (error.body as { detail?: unknown })?.detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const firstMessage = (detail[0] as { msg?: unknown })?.msg;
      if (typeof firstMessage === "string" && firstMessage.trim()) {
        return firstMessage;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

async function copyTextRobust(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export function ListingDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams({ from: "/listings/$id" });
  const search = useSearch({ from: "/listings/$id" }) as
    | { offerId?: string }
    | undefined;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [offerPrice, setOfferPrice] = useState("");
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isOfferDetailModalOpen, setIsOfferDetailModalOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | undefined>(
    undefined,
  );
  const { user, isAuthenticated } = useAuthUser();

  // Auto-open offer detail modal if offerId is in URL search params
  useEffect(() => {
    if (search?.offerId) {
      setSelectedOfferId(search.offerId);
      setIsOfferDetailModalOpen(true);
    }
  }, [search?.offerId]);

  const listingQuery = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListingDetails(id),
    enabled: !!id,
  });

  const sellerId = listingQuery.data?.seller_id ?? "";
  const sellerProfileQuery = useQuery({
    queryKey: ["seller-profile", sellerId],
    queryFn: () => getUserPublicProfile(sellerId),
    enabled: !!sellerId,
  });
  const isSellerOnline = useIsUserOnline(sellerId);

  const categoriesQuery = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => getCategoriesTree(),
  });

  const createOrderMutation = useMutation({
    mutationFn: createOrder,
  });

  const createOfferMutation = useMutation({
    mutationFn: createOffer,
  });

  // Seller's other listings (exclude current)
  const sellerListingsQuery = useQuery({
    queryKey: ["seller-listings", sellerId],
    queryFn: () => getSellerListings({ sellerId, limit: 7 }),
    enabled: !!sellerId,
  });

  // Similar listings (same category, exclude current + seller)
  const categoryId = listingQuery.data?.category_id ?? "";
  const similarListingsQuery = useQuery({
    queryKey: ["similar-listings", categoryId],
    queryFn: () => getListings({ categoryId, limit: 9 }),
    enabled: !!categoryId,
  });

  // Hook must be called unconditionally before early returns
  const isOwnListingCheck =
    user?.id && listingQuery.data?.seller_id === user.id;
  const listingOffersQuery = useOffersForListing(
    isOwnListingCheck && listingQuery.data ? listingQuery.data.id : "",
    {
      limit: 20,
    },
  );

  const categoryMap = new Map<string, CategoryTree>();
  if (categoriesQuery.data) {
    flattenCategories(categoriesQuery.data).forEach((cat) => {
      categoryMap.set(cat.id, cat);
    });
  }

  if (listingQuery.isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  if (listingQuery.isError || !listingQuery.data) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/" })}
            color="blue.600"
            _hover={{ bg: "blue.50" }}
            mb={6}
          >
            <FiArrowLeft style={{ marginRight: "0.5rem" }} />
            Quay lại
          </Button>
          <Box
            bg="white"
            borderRadius="xl"
            p={8}
            textAlign="center"
            boxShadow="sm"
          >
            <Box
              as={FiAlertCircle}
              w={12}
              h={12}
              color="red.400"
              mx="auto"
              mb={4}
            />
            <Heading as="h2" size="lg" color="gray.900" mb={2}>
              Không tìm thấy sản phẩm
            </Heading>
            <Text color="gray.500">
              Sản phẩm này không tồn tại hoặc đã bị xóa.
            </Text>
          </Box>
        </Container>
      </Box>
    );
  }

  const listing = listingQuery.data;
  const _category = categoryMap.get(listing.category_id);
  const conditionInfo = CONDITION_LABELS[listing.condition_grade] ?? {
    label: listing.condition_grade,
    color: "gray",
  };
  const statusInfo = STATUS_LABELS[listing.status] ?? {
    label: listing.status,
    color: "gray",
  };

  const images = listing.images ?? [];
  const currentImage = images[selectedImageIndex];
  const isOwnListing = user?.id === listing.seller_id;
  const canTransact = listing.status === "active" && !isOwnListing;

  const requireAuth = () => {
    if (isAuthenticated) {
      return true;
    }
    navigate({ to: "/auth/login" });
    return false;
  };

  const handleBuyNow = async () => {
    if (!requireAuth()) {
      return;
    }

    if (!canTransact) {
      toaster.create({
        title: "Bạn không thể mua sản phẩm này ở thời điểm hiện tại.",
        type: "error",
      });
      return;
    }

    try {
      const order = await createOrderMutation.mutateAsync({
        listing_id: listing.id,
        use_escrow: true,
      });
      toaster.create({
        title: `Đặt hàng thành công. Mã đơn: ${order.id.slice(0, 8)}... Vào trang đơn hàng để fund ví demo.`,
        type: "success",
      });
    } catch (error) {
      toaster.create({
        title: getErrorMessage(
          error,
          "Không thể tạo đơn hàng. Vui lòng thử lại.",
        ),
        type: "error",
      });
    }
  };

  const handleOpenOfferDialog = () => {
    if (!requireAuth()) {
      return;
    }

    if (!canTransact) {
      toaster.create({
        title: "Bạn không thể thương lượng sản phẩm này ở thời điểm hiện tại.",
        type: "error",
      });
      return;
    }

    setOfferPrice(listing.price);
    setIsOfferDialogOpen(true);
  };

  const handleSubmitOffer = async () => {
    const parsedPrice = Number(offerPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      toaster.create({
        title: "Giá đề xuất phải là số lớn hơn 0.",
        type: "error",
      });
      return;
    }

    try {
      await createOfferMutation.mutateAsync({
        listing_id: listing.id,
        offer_price: parsedPrice,
      });
      setIsOfferDialogOpen(false);
      toaster.create({
        title: "Đã gửi đề xuất giá cho người bán thành công.",
        type: "success",
      });
    } catch (error) {
      toaster.create({
        title: getErrorMessage(
          error,
          "Không thể gửi đề xuất giá. Vui lòng thử lại.",
        ),
        type: "error",
      });
    }
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/" })}
          color="blue.600"
          _hover={{ bg: "blue.50" }}
          mb={6}
        >
          <FiArrowLeft style={{ marginRight: "0.5rem" }} />
          Quay lại trang chủ
        </Button>

        <Flex direction={{ base: "column", lg: "row" }} gap={8} align="stretch">
          {/* Image Gallery */}
          <Box w={{ base: "full", lg: "520px" }} flexShrink={0}>
            <Flex direction="column" h="full" gap={4}>
              {/* Main Image */}
              <Box
                flex={1}
                bg="transparent"
                position="relative"
                borderRadius="xl"
                overflow="hidden"
                boxShadow="sm"
              >
                {currentImage ? (
                  <Image
                    src={getListingImageUrl(currentImage.image_url)}
                    alt={listing.title}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                ) : (
                  <Flex
                    h="full"
                    align="center"
                    justify="center"
                    color="gray.400"
                    bg="gray.100"
                  >
                    <Text>Chưa có ảnh</Text>
                  </Flex>
                )}

                {/* Status Badge */}
                {listing.status !== "active" && (
                  <Badge
                    position="absolute"
                    top={4}
                    left={4}
                    colorPalette={statusInfo.color as any}
                    variant="solid"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="sm"
                  >
                    {statusInfo.label}
                  </Badge>
                )}
              </Box>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <SimpleGrid columns={5} gap={2}>
                  {images.map((img, index) => (
                    <Box
                      key={img.id}
                      aspectRatio={1}
                      borderRadius="md"
                      overflow="hidden"
                      cursor="pointer"
                      borderWidth="2px"
                      borderStyle="solid"
                      borderColor={
                        index === selectedImageIndex
                          ? "blue.500"
                          : "transparent"
                      }
                      opacity={index === selectedImageIndex ? 1 : 0.6}
                      onClick={() => setSelectedImageIndex(index)}
                      transition="all 0.2s"
                      _hover={{
                        opacity: 1,
                        borderColor:
                          index === selectedImageIndex
                            ? "blue.500"
                            : "gray.300",
                      }}
                      bg="gray.100"
                    >
                      <Image
                        src={getListingImageUrl(img.image_url)}
                        alt={`${listing.title} - ${index + 1}`}
                        w="full"
                        h="full"
                        objectFit="cover"
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Flex>
          </Box>

          {/* Product Info */}
          <Box flex={1} minW={0}>
            <VStack gap={4} align="stretch">
              {/* Main Info Card */}
              <Box
                bg="whiteAlpha.800"
                backdropFilter="blur(20px)"
                borderRadius="xl"
                boxShadow="0 10px 40px rgba(0,0,0,0.06)"
                border="1px"
                borderColor="whiteAlpha.400"
                overflow="hidden"
              >
                <Box p={6}>
                  {/* Category */}
                  {/* <HStack gap={2} mb={3}>
                    <Box as={FiTag} w={4} h={4} color="gray.400" />
                    <Text fontSize="sm" color="gray.500">
                      {category?.name ?? "Chưa phân loại"}
                    </Text>
                  </HStack> */}

                  {/* Title */}
                  <Heading as="h1" size="lg" color="gray.900" mb={4}>
                    {listing.title}
                  </Heading>

                  {/* Price */}
                  <Box mb={4}>
                    <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                      {formatCurrencyVnd(listing.price)}
                    </Text>
                    {listing.is_negotiable && (
                      <Badge
                        colorPalette="green"
                        variant="subtle"
                        mt={1}
                        fontSize="xs"
                      >
                        Có thể thương lượng
                      </Badge>
                    )}
                  </Box>

                  {/* Condition */}
                  <HStack gap={2} mb={4}>
                    <Box
                      as={FiCheckCircle}
                      w={4}
                      h={4}
                      color={`${conditionInfo.color}.500`}
                    />
                    <Text fontSize="sm" color="gray.700">
                      Tình trạng:{" "}
                      <Text
                        as="span"
                        fontWeight="semibold"
                        color={`${conditionInfo.color}.600`}
                      >
                        {conditionInfo.label}
                      </Text>
                    </Text>
                  </HStack>

                  {/* Posted Time */}
                  <HStack gap={2}>
                    <Box as={FiCalendar} w={4} h={4} color="gray.400" />
                    <Text fontSize="sm" color="gray.500">
                      Đăng {formatPostedTime(listing.created_at)}
                    </Text>
                  </HStack>
                </Box>

                <Separator />

                {/* Action Buttons */}
                <Box p={4}>
                  <VStack gap={3}>
                    <Button
                      w="full"
                      size="lg"
                      borderRadius="lg"
                      onClick={handleBuyNow}
                      loading={createOrderMutation.isPending}
                      disabled={!canTransact}
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
                      Mua ngay
                    </Button>
                    {listing.is_negotiable && (
                      <Button
                        w="full"
                        size="lg"
                        borderRadius="lg"
                        onClick={handleOpenOfferDialog}
                        loading={createOfferMutation.isPending}
                        disabled={!canTransact}
                        className="btn-shine"
                        boxShadow="0 4px 15px rgba(249,115,22,0.35)"
                        style={{
                          background:
                            "linear-gradient(135deg, #f97316, #eab308)",
                          color: "white",
                          position: "relative",
                          overflow: "hidden",
                          border: "none",
                        }}
                        _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                        transition="all 0.2s"
                      >
                        Thương lượng
                      </Button>
                    )}

                    <HStack w="full" gap={3}>
                      <Button
                        flex={1}
                        className="btn-shine"
                        boxShadow="0 4px 15px rgba(6,182,212,0.35)"
                        style={{
                          background:
                            "linear-gradient(135deg, #0ea5e9, #06b6d4)",
                          color: "white",
                          position: "relative",
                          overflow: "hidden",
                          border: "none",
                        }}
                        _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
                        transition="all 0.2s"
                        onClick={() => {
                          if (!requireAuth()) {
                            return;
                          }
                          openChatWidget(listing.seller_id, listing.id);
                        }}
                      >
                        <FiMessageCircle style={{ marginRight: "0.5rem" }} />
                        Nhắn tin
                      </Button>
                      <Button
                        flex={1}
                        variant="outline"
                        borderColor="gray.300"
                        color="gray.700"
                        _hover={{ bg: "gray.50" }}
                        onClick={async () => {
                          const url = `${window.location.origin}/listings/${listing.id}`;
                          const copied = await copyTextRobust(url);
                          if (copied) {
                            toaster.create({
                              title:
                                "Đã copy link tin đăng. Dán vào chat để gửi card sản phẩm.",
                              type: "success",
                            });
                          } else {
                            toaster.create({
                              title: "Không thể copy link. Vui lòng thử lại.",
                              type: "error",
                            });
                          }
                        }}
                      >
                        <FiShare2 style={{ marginRight: "0.5rem" }} />
                        Chia sẻ
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              </Box>

              {/* Seller Info Card */}
              <Link
                to="/sellers/$id"
                params={{ id: listing.seller_id }}
                style={{ textDecoration: "none" }}
              >
                <Box
                  bg="whiteAlpha.800"
                  backdropFilter="blur(20px)"
                  borderRadius="xl"
                  boxShadow="0 10px 40px rgba(0,0,0,0.06)"
                  border="1px"
                  borderColor="whiteAlpha.400"
                  p={5}
                  transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
                    borderColor: "blue.200",
                    transform: "translateY(-2px)",
                  }}
                  cursor="pointer"
                >
                  <HStack gap={3} mb={3}>
                    <Box as={FiUser} w={5} h={5} color="gray.400" />
                    <Text fontSize="md" fontWeight="semibold" color="gray.900">
                      Thông tin người bán
                    </Text>
                  </HStack>
                  <Box
                    bg="gray.50"
                    borderRadius="lg"
                    p={4}
                    display="flex"
                    alignItems="flex-start"
                    gap={3}
                  >
                    <Box
                      w={12}
                      h={12}
                      bg="blue.100"
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      overflow="hidden"
                      flexShrink={0}
                    >
                      {sellerProfileQuery.data?.avatar_url ? (
                        <Image
                          src={sellerProfileQuery.data.avatar_url}
                          alt={sellerProfileQuery.data.full_name}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      ) : (
                        <Box as={FiUser} w={6} h={6} color="blue.500" />
                      )}
                    </Box>
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.900"
                        lineClamp={1}
                      >
                        {sellerProfileQuery.data?.full_name || "Người bán"}
                      </Text>
                      <Badge
                        mt={1}
                        colorPalette={isSellerOnline ? "green" : "gray"}
                        variant="subtle"
                        borderRadius="full"
                        px={2}
                        py={0.5}
                        fontSize="10px"
                      >
                        {isSellerOnline ? "Đang online" : "Đang offline"}
                      </Badge>
                      <HStack gap={3} mt={1} flexWrap="wrap">
                        <Text fontSize="xs" color="gray.600">
                          Đã bán:{" "}
                          {sellerProfileQuery.data?.completed_orders ?? 0} sản
                          phẩm
                        </Text>
                        <HStack gap={1} color="yellow.500">
                          <Box as={FiStar} w={3.5} h={3.5} />
                          <Text fontSize="xs" color="gray.600">
                            {sellerProfileQuery.data
                              ? sellerProfileQuery.data.rating_avg.toFixed(1)
                              : "0.0"}{" "}
                            sao
                          </Text>
                        </HStack>
                      </HStack>
                      {sellerProfileQuery.isLoading && (
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Đang tải thông tin người bán...
                        </Text>
                      )}
                      <Text
                        fontSize="sm"
                        color="blue.600"
                        mt={1}
                        _hover={{ textDecoration: "underline" }}
                      >
                        Xem trang cá nhân
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Link>
            </VStack>
          </Box>
        </Flex>

        {/* Description Section */}
        <Box mt={8}>
          <SimpleGrid columns={{ base: 1, lg: 12 }} gap={8}>
            <Box gridColumn={{ base: "span 1", lg: "span 8" }}>
              <VStack gap={8} align="stretch">
                {isOwnListing && (
                  <Box
                    bg="whiteAlpha.800"
                    backdropFilter="blur(20px)"
                    borderRadius="xl"
                    boxShadow="0 10px 40px rgba(0,0,0,0.06)"
                    border="1px"
                    borderColor="whiteAlpha.400"
                    p={6}
                  >
                    <Heading as="h2" size="md" color="gray.900" mb={4}>
                      Offers cho tin đăng này
                    </Heading>

                    {listingOffersQuery.isLoading ? (
                      <Flex py={6} justify="center">
                        <Spinner size="md" color="blue.500" />
                      </Flex>
                    ) : listingOffersQuery.data &&
                      listingOffersQuery.data.length > 0 ? (
                      <VStack align="stretch" gap={3}>
                        {listingOffersQuery.data.map((offer) => {
                          const statusMeta = OFFER_STATUS_META[
                            offer.status
                          ] ?? {
                            label: offer.status,
                            color: "gray",
                          };

                          return (
                            <Box
                              key={offer.id}
                              border="1px"
                              borderColor="gray.200"
                              borderRadius="lg"
                              p={4}
                            >
                              <Flex
                                justify="space-between"
                                align={{ base: "start", md: "center" }}
                                gap={3}
                              >
                                <Box>
                                  <Text fontWeight="semibold" color="gray.900">
                                    {formatCurrencyVnd(
                                      Math.floor(Number(offer.offer_price)),
                                    )}
                                  </Text>
                                  <Text fontSize="sm" color="gray.500">
                                    Offer: {offer.id.slice(0, 8)}... ·{" "}
                                    {new Date(offer.created_at).toLocaleString(
                                      "vi-VN",
                                    )}
                                  </Text>
                                </Box>

                                <HStack>
                                  <Badge colorPalette={statusMeta.color as any}>
                                    {statusMeta.label}
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedOfferId(offer.id);
                                      setIsOfferDetailModalOpen(true);
                                    }}
                                  >
                                    Xem chi tiết
                                  </Button>
                                </HStack>
                              </Flex>
                            </Box>
                          );
                        })}
                      </VStack>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        Chưa có đề xuất giá nào cho tin đăng này.
                      </Text>
                    )}
                  </Box>
                )}

                <Box
                  bg="whiteAlpha.800"
                  backdropFilter="blur(20px)"
                  borderRadius="xl"
                  boxShadow="0 10px 40px rgba(0,0,0,0.06)"
                  border="1px"
                  borderColor="whiteAlpha.400"
                  p={6}
                >
                  <Heading as="h2" size="md" color="gray.900" mb={4}>
                    Mô tả sản phẩm
                  </Heading>
                  {listing.description ? (
                    <Text
                      color="gray.700"
                      whiteSpace="pre-wrap"
                      lineHeight={1.8}
                    >
                      {listing.description}
                    </Text>
                  ) : (
                    <Text color="gray.400" fontStyle="italic">
                      Người bán chưa thêm mô tả cho sản phẩm này.
                    </Text>
                  )}
                </Box>
              </VStack>
            </Box>

            <Box gridColumn={{ base: "span 1", lg: "span 4" }}>
              {/* Sidebar content could go here in future */}
            </Box>
          </SimpleGrid>
        </Box>
      </Container>

      {/* ===== EXTRA SECTIONS ===== */}
      <Box bg="gray.50">
        <Container maxW="1400px" mx="auto" px={{ base: 4, md: 6 }}>
          {/* CTA Banner */}
          <Box
            mt={8}
            p={{ base: 5, md: 7 }}
            borderRadius="2xl"
            background="linear-gradient(135deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)"
            color="white"
            display="flex"
            flexDirection={{ base: "column", sm: "row" }}
            alignItems="center"
            justifyContent="space-between"
            gap={4}
            boxShadow="0 8px 30px rgba(251,146,60,0.35)"
          >
            <Box>
              <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="800" mb={1}>
                Bạn có sản phẩm tương tự?
              </Text>
              <Text fontSize="sm" opacity={0.9}>
                Đăng tin miễn phí – Tiếp cận hàng nghìn người mua ngay hôm nay!
              </Text>
            </Box>
            <Button
              asChild
              bg="white"
              color="orange.500"
              fontWeight="700"
              flexShrink={0}
              borderRadius="xl"
              px={7}
              _hover={{ bg: "orange.50", transform: "translateY(-1px)" }}
              transition="all 0.2s"
              size="lg"
            >
              <Link to="/my-listings">Đăng tin ngay</Link>
            </Button>
          </Box>

          {/* Seller's other listings */}
          {sellerListingsQuery.data &&
            sellerListingsQuery.data.items.filter((l) => l.id !== id).length >
              0 && (
              <Box mt={12}>
                <Flex align="center" gap={3} mb={5}>
                  <Heading
                    as="h2"
                    fontSize="lg"
                    fontWeight="800"
                    color="gray.900"
                  >
                    Tin rao khác của người bán
                  </Heading>
                </Flex>
                <SimpleGrid
                  columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
                  gap={4}
                >
                  {sellerListingsQuery.data.items
                    .filter((l) => l.id !== id)
                    .slice(0, 6)
                    .map((l) => (
                      <ListingCard
                        key={l.id}
                        listing={l}
                        categoryMap={categoryMap}
                        seller={sellerProfileQuery.data}
                      />
                    ))}
                </SimpleGrid>
              </Box>
            )}

          {/* Similar Listings */}
          {similarListingsQuery.data &&
            similarListingsQuery.data.items.filter(
              (l) => l.id !== id && l.seller_id !== sellerId,
            ).length > 0 && (
              <Box mt={12} mb={12}>
                <Flex align="center" gap={3} mb={5}>
                  <Heading
                    as="h2"
                    fontSize="lg"
                    fontWeight="800"
                    color="gray.900"
                  >
                    Tin đăng tương tự
                  </Heading>
                </Flex>
                <SimpleGrid columns={{ base: 2, sm: 3, md: 4, lg: 5 }} gap={4}>
                  {similarListingsQuery.data.items
                    .filter((l) => l.id !== id && l.seller_id !== sellerId)
                    .slice(0, 8)
                    .map((l) => (
                      <ListingCard
                        key={l.id}
                        listing={l}
                        categoryMap={categoryMap}
                      />
                    ))}
                </SimpleGrid>
              </Box>
            )}
        </Container>
      </Box>

      <Dialog.Root
        open={isOfferDialogOpen}
        onOpenChange={(e) => setIsOfferDialogOpen(e.open)}
        placement="center"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content maxW="sm" bg="white" borderRadius="lg">
              <Dialog.Header
                p={5}
                borderBottomWidth="1px"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Dialog.Title fontSize="lg" fontWeight="semibold">
                  Gửi đề xuất giá
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body p={5}>
                <VStack align="stretch" gap={4}>
                  <Text fontSize="sm" color="gray.600">
                    Nhập mức giá bạn muốn đề xuất cho người bán.
                  </Text>
                  <Input
                    type="number"
                    min={1}
                    step={1000}
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="Nhập giá đề xuất"
                  />
                  <HStack justify="flex-end" gap={3}>
                    <Button
                      variant="outline"
                      onClick={() => setIsOfferDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button
                      colorPalette="orange"
                      onClick={handleSubmitOffer}
                      loading={createOfferMutation.isPending}
                    >
                      Gửi đề xuất
                    </Button>
                  </HStack>
                </VStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Offer Detail Modal */}
      <OfferDetailModal
        isOpen={isOfferDetailModalOpen}
        onOpenChange={setIsOfferDetailModalOpen}
        offerId={selectedOfferId}
      />
    </Box>
  );
}
