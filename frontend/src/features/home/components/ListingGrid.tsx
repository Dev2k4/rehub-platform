import { Box, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { FiHeart, FiTag, FiImage } from "react-icons/fi";
import type {
  CategoryTree,
  ListingWithImages,
  UserPublicProfile,
} from "@/client";
import { Tooltip } from "@/components/ui/tooltip";
import {
  formatCurrencyVnd,
  formatPostedTime,
  getListingImageUrl,
} from "@/features/home/utils/marketplace.utils";
import { useIsUserOnline } from "@/features/shared/realtime/ws.provider";

type ListingGridProps = {
  listings: ListingWithImages[];
  categoryMap: Map<string, CategoryTree>;
  sellerMap: Map<string, UserPublicProfile>;
};

const CONDITION_BADGE: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  brand_new: { label: "Mới 100%", bg: "#D1FAE5", color: "#065F46" },
  like_new: { label: "Như mới", bg: "#DBEAFE", color: "#1E40AF" },
  good: { label: "Còn tốt", bg: "#FEF3C7", color: "#92400E" },
  fair: { label: "Khá tốt", bg: "#FFEDD5", color: "#9A3412" },
  poor: { label: "Đã cũ", bg: "#F3F4F6", color: "#374151" },
};

export function ListingGrid({
  listings,
  categoryMap,
  sellerMap,
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <Box
        borderRadius="1.25rem"
        border="2px dashed"
        borderColor="gray.200"
        bg="white"
        py={12}
        textAlign="center"
      >
        <Box fontSize="3rem" mb="0.75rem">
          📭
        </Box>
        <Text fontSize="sm" color="gray.500" fontWeight="500">
          Không tìm thấy sản phẩm phù hợp.
        </Text>
        <Text fontSize="xs" color="gray.400" mt="0.25rem">
          Thử thay đổi bộ lọc hoặc tìm kiếm với từ khoá khác.
        </Text>
      </Box>
    );
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
  );
}

type ListingGridItemProps = {
  listing: ListingWithImages;
  category?: CategoryTree;
  seller?: UserPublicProfile;
  animDelay?: number;
};

function ListingGridItem({
  listing,
  category,
  seller,
  animDelay = 0,
}: ListingGridItemProps) {
  const navigate = useNavigate();
  const isSellerOnline = useIsUserOnline(listing.seller_id);
  const firstImageUrl = getListingImageUrl(listing.images?.[0]?.image_url);
  const badge =
    CONDITION_BADGE[listing.condition_grade] ?? CONDITION_BADGE.poor;

  const delayClass = `delay-${Math.min(animDelay, 7)}`;

  return (
    <Box
      className={`listing-card-root animate-fadeinup ${delayClass}`}
      onClick={() =>
        navigate({ to: "/listings/$id", params: { id: listing.id } })
      }
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          navigate({ to: "/listings/$id", params: { id: listing.id } });
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
          onClick={(e) => e.stopPropagation()}
          aria-label="Yêu thích"
        >
          <FiHeart size={14} />
        </Box>
      </Box>

      {/* Content */}
      <Box p="0.75rem" display="flex" flexDir="column" gap="0.35rem">
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

        {/* Price – red like TMĐT */}
        <Text fontSize="1rem" fontWeight="800" color="#E53E3E" lineHeight="1.2">
          {formatCurrencyVnd(listing.price)}
        </Text>

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
        </Flex>

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
    </Box>
  );
}
