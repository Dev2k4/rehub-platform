import { Box, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react"
import { Link, useNavigate } from "@tanstack/react-router"
import {
  FiCamera,
  FiEye,
  FiHeart,
  FiImage,
  FiMapPin,
  FiMessageCircle,
  FiShare2,
  FiStar,
  FiTag,
} from "react-icons/fi"
import type {
  CategoryTree,
  ListingWithImages,
  UserPublicProfile,
} from "@/client"
import { toaster } from "@/components/ui/toaster"
import { Tooltip } from "@/components/ui/tooltip"
import {
  formatCurrencyVnd,
  formatPostedTime,
  getListingImageUrl,
} from "@/features/home/utils/marketplace.utils"
import { useIsUserOnline } from "@/features/shared/realtime/ws.provider"

type ListingGridProps = {
  listings: ListingWithImages[]
  categoryMap: Map<string, CategoryTree>
  sellerMap: Map<string, UserPublicProfile>
  isLoading?: boolean
  skeletonRows?: number
  emptyStateTitle?: string
  emptyStateDescription?: string
}

const CONDITION_BADGE: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  brand_new: { label: "Mới 100%", bg: "#D1FAE5", color: "#065F46" },
  like_new: { label: "Như mới", bg: "#DBEAFE", color: "#1E40AF" },
  good: { label: "Còn tốt", bg: "#FEF3C7", color: "#92400E" },
  fair: { label: "Khá tốt", bg: "#FFEDD5", color: "#9A3412" },
  poor: { label: "Đã cũ", bg: "#F3F4F6", color: "#374151" },
}

export function ListingGrid({
  listings,
  categoryMap,
  sellerMap,
  isLoading = false,
  skeletonRows = 2,
  emptyStateTitle,
  emptyStateDescription,
}: ListingGridProps) {
  if (isLoading) {
    return <ListingGridSkeleton rows={skeletonRows} />
  }

  if (listings.length === 0) {
    return (
      <Box
        borderRadius="1.25rem"
        border="2px dashed"
        borderColor="gray.200"
        bg="white"
        py={16}
        textAlign="center"
      >
        <Box
          fontSize="3.5rem"
          mb="1rem"
          style={{ animation: "float 3s ease-in-out infinite" }}
        >
          📭
        </Box>
        <Text fontSize="md" color="gray.600" fontWeight="700" mb={2}>
          {emptyStateTitle || "Không tìm thấy sản phẩm phù hợp"}
        </Text>
        <Text fontSize="sm" color="gray.400">
          {emptyStateDescription ||
            "Thử thay đổi bộ lọc hoặc tìm kiếm với từ khoá khác."}
        </Text>
      </Box>
    )
  }

  return (
    <SimpleGrid columns={{ base: 2, sm: 2, lg: 3, xl: 4 }} gap={3}>
      {listings.map((listing, idx) => (
        <ListingGridItem
          key={listing.id}
          listing={listing}
          category={categoryMap.get(listing.category_id)}
          seller={sellerMap.get(listing.seller_id)}
          animDelay={idx % 8}
        />
      ))}
    </SimpleGrid>
  )
}

function ListingGridSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <Flex direction="column" gap={3}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <SimpleGrid
          key={rowIndex}
          columns={{ base: 2, sm: 2, lg: 3, xl: 4 }}
          gap={3}
        >
          {Array.from({ length: 4 }).map((__, itemIndex) => (
            <Box
              key={`${rowIndex}-${itemIndex}`}
              bg="white"
              border="1px solid"
              borderColor="gray.100"
              borderRadius="1rem"
              overflow="hidden"
            >
              <Box className="animate-shimmer" aspectRatio={1} />
              <Box p="0.75rem">
                <Box className="animate-shimmer" h="10px" borderRadius="md" mb={2} />
                <Box className="animate-shimmer" h="10px" borderRadius="md" mb={3} w="72%" />
                <Box className="animate-shimmer" h="12px" borderRadius="md" w="48%" mb={3} />
                <Box className="animate-shimmer" h="9px" borderRadius="md" mb={2} w="66%" />
                <Box className="animate-shimmer" h="9px" borderRadius="md" w="54%" />
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      ))}
    </Flex>
  )
}

type ListingGridItemProps = {
  listing: ListingWithImages
  category?: CategoryTree
  seller?: UserPublicProfile
  animDelay?: number
}

function ListingGridItem({
  listing,
  category,
  seller,
  animDelay = 0,
}: ListingGridItemProps) {
  const navigate = useNavigate()
  const isSellerOnline = useIsUserOnline(listing.seller_id)
  const firstImageUrl = getListingImageUrl(listing.images?.[0]?.image_url)
  const badge = CONDITION_BADGE[listing.condition_grade] ?? CONDITION_BADGE.poor

  const delayClass = `delay-${Math.min(animDelay, 7)}`
  const imageCount = listing.images?.length ?? 0
  const locationLabel = [seller?.district, seller?.province]
    .filter(Boolean)
    .join(", ")
  const sellerTrust = Math.round(seller?.trust_score ?? 0)
  const sellerRating = Number((seller?.rating_avg ?? 0).toFixed(1))
  const completedOrders = seller?.completed_orders ?? 0

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard
      .writeText(`${window.location.origin}/listings/${listing.id}`)
      .then(() => {
        toaster.create({ title: "Đã sao chép link!", type: "success" })
      })
      .catch(() => {})
  }

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate({ to: "/chat" })
  }

  return (
    <Box
      className={`listing-card-root animate-fadeinup ${delayClass}`}
      onClick={() =>
        navigate({ to: "/listings/$id", params: { id: listing.id } })
      }
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          navigate({ to: "/listings/$id", params: { id: listing.id } })
        }
      }}
      role="link"
      tabIndex={0}
      as="article"
      bg="white"
      borderRadius="1rem"
      border="1px solid"
      borderColor="gray.100"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
      overflow="hidden"
      transition="all 0.3s ease"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
        borderColor: "blue.200",
      }}
      cursor="pointer"
      display="flex"
      flexDirection="column"
    >
      {/* Image area */}
      <Box
        className="listing-card-img-wrapper"
        position="relative"
        w="full"
        aspectRatio={1}
        overflow="hidden"
        bg="gray.50"
      >
        {firstImageUrl ? (
          <img
            src={firstImageUrl}
            alt={listing.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Flex
            h="full"
            w="full"
            align="center"
            justify="center"
            flexDirection="column"
            gap={2}
            color="gray.400"
            bg="gray.100"
          >
            <FiImage size={32} opacity={0.6} />
            <Text fontSize="xs" fontWeight="500">
              Chưa có ảnh
            </Text>
          </Flex>
        )}

        {/* Quick View Overlay */}
        <div className="listing-card-overlay">
          <button className="listing-card-overlay-btn">
            <FiEye style={{ display: "inline", marginRight: "4px" }} /> Xem
            nhanh
          </button>
        </div>

        {/* Condition badge */}
        <Box
          className="listing-card-badge"
          style={{ background: badge.bg, color: badge.color }}
        >
          {badge.label}
        </Box>

        {/* Heart button */}
        <Box
          as="button"
          className="listing-heart-btn"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          aria-label="Yêu thích"
        >
          <FiHeart size={14} />
        </Box>

        {/* Stats row at bottom of image */}
        <Flex
          position="absolute"
          bottom="0"
          left="0"
          right="0"
          px="0.5rem"
          py="0.3rem"
          align="center"
          justify="flex-end"
          gap="0.6rem"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)",
          }}
        >
          <Flex align="center" gap="0.2rem" color="white" fontSize="0.65rem">
            <FiCamera size={10} />
            <Text>{imageCount} ảnh</Text>
          </Flex>
          <Flex align="center" gap="0.2rem" color="white" fontSize="0.65rem">
            <FiEye size={10} />
            <Text>{formatPostedTime(listing.updated_at)}</Text>
          </Flex>
        </Flex>
      </Box>

      {/* Content */}
      <Box p="0.75rem" display="flex" flexDir="column" gap="0.35rem" flex={1}>
        <Tooltip content={listing.title} showArrow>
          <Heading
            as="h3"
            fontSize="0.85rem"
            fontWeight="700"
            color="gray.900"
            lineClamp={2}
            lineHeight="1.35"
          >
            {listing.title}
          </Heading>
        </Tooltip>

        {/* Price */}
        <Text fontSize="1rem" fontWeight="800" color="#E53E3E" lineHeight="1.2">
          {formatCurrencyVnd(listing.price)}
        </Text>

        {listing.is_negotiable ? (
          <Text
            w="fit-content"
            fontSize="0.62rem"
            fontWeight="700"
            color="green.700"
            bg="green.50"
            borderRadius="full"
            px="0.45rem"
            py="0.1rem"
          >
            Có thể thương lượng
          </Text>
        ) : null}

        {locationLabel ? (
          <Flex align="center" gap="0.25rem" fontSize="0.68rem" color="gray.500">
            <Box as={FiMapPin} w="10px" h="10px" />
            <Text lineClamp={1}>{locationLabel}</Text>
          </Flex>
        ) : null}

        {/* Seller row */}
        <Flex align="center" gap="0.35rem" fontSize="0.72rem">
          <Box
            w="6px"
            h="6px"
            borderRadius="50%"
            bg={isSellerOnline ? "green.400" : "gray.300"}
            flexShrink={0}
          />
          <Link
            to="/sellers/$id"
            params={{ id: listing.seller_id }}
            onClick={(event) => event.stopPropagation()}
            style={{ textDecoration: "none" }}
          >
            <Text
              color="gray.600"
              _hover={{ color: "blue.500", textDecoration: "underline" }}
              lineClamp={1}
            >
              {seller?.full_name || "Người bán"}
            </Text>
          </Link>
          {seller && (seller as any).trust_score > 60 && (
            <Box
              fontSize="0.6rem"
              bg="green.50"
              color="green.700"
              px="0.3rem"
              py="0.05rem"
              borderRadius="0.3rem"
              fontWeight="700"
              flexShrink={0}
            >
              ✓ Uy tín
            </Box>
          )}
        </Flex>

        {seller ? (
          <Flex gap="0.35rem" flexWrap="wrap" mt="0.1rem">
            <Flex
              align="center"
              gap="0.2rem"
              fontSize="0.62rem"
              color="amber.700"
              bg="amber.50"
              px="0.4rem"
              py="0.1rem"
              borderRadius="0.35rem"
            >
              <FiStar size={10} />
              <Text>{sellerRating}/5</Text>
            </Flex>
            <Text
              fontSize="0.62rem"
              color="gray.600"
              bg="gray.100"
              px="0.4rem"
              py="0.1rem"
              borderRadius="0.35rem"
            >
              {completedOrders} giao dịch
            </Text>
            <Text
              fontSize="0.62rem"
              color="blue.700"
              bg="blue.50"
              px="0.4rem"
              py="0.1rem"
              borderRadius="0.35rem"
            >
              Trust {sellerTrust}
            </Text>
          </Flex>
        ) : null}

        {/* Category + time */}
        <Flex
          align="center"
          justify="space-between"
          fontSize="0.7rem"
          color="gray.400"
          mt="0.1rem"
        >
          <Flex align="center" gap="0.25rem">
            <Box as={FiTag} w="10px" h="10px" />
            <Text lineClamp={1}>{category?.name ?? "Danh mục"}</Text>
          </Flex>
          <Text>{formatPostedTime(listing.created_at)}</Text>
        </Flex>
      </Box>

      {/* Quick Action Row */}
      <div className="listing-quick-actions">
        <Tooltip content="Chat với người bán">
          <button className="listing-quick-btn" onClick={handleChatClick}>
            <FiMessageCircle size={10} /> Chat
          </button>
        </Tooltip>
        <Tooltip content="Thêm vào yêu thích">
          <button
            className="listing-quick-btn"
            onClick={(e) => e.stopPropagation()}
          >
            <FiHeart size={10} /> Thích
          </button>
        </Tooltip>
        <Tooltip content="Chia sẻ sản phẩm">
          <button className="listing-quick-btn" onClick={handleShareClick}>
            <FiShare2 size={10} /> Chia sẻ
          </button>
        </Tooltip>
      </div>
    </Box>
  )
}
