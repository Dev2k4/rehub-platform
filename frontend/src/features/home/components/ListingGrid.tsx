import {
  Badge,
  Box,
  Flex,
  Heading,
  Image,
  SimpleGrid,
  Text,
} from "@chakra-ui/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { FiStar, FiTag, FiUser } from "react-icons/fi"
import type {
  CategoryTree,
  ListingWithImages,
  UserPublicProfile,
} from "@/client"
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
}

export function ListingGrid({
  listings,
  categoryMap,
  sellerMap,
}: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <Box
        borderRadius="2xl"
        border="2px dashed"
        borderColor="gray.300"
        bg="white"
        p={8}
        textAlign="center"
        fontSize="sm"
        color="gray.500"
      >
        Không có sản phẩm phù hợp với bộ lọc hiện tại.
      </Box>
    )
  }

  return (
    <SimpleGrid columns={{ base: 2, sm: 2, lg: 3, xl: 4 }} gap={3}>
      {listings.map((listing) => (
        <ListingGridItem
          key={listing.id}
          listing={listing}
          category={categoryMap.get(listing.category_id)}
          seller={sellerMap.get(listing.seller_id)}
        />
      ))}
    </SimpleGrid>
  )
}

type ListingGridItemProps = {
  listing: ListingWithImages
  category?: CategoryTree
  seller?: UserPublicProfile
}

function ListingGridItem({ listing, category, seller }: ListingGridItemProps) {
  const navigate = useNavigate()
  const isSellerOnline = useIsUserOnline(listing.seller_id)
  const firstImageUrl = getListingImageUrl(listing.images?.[0]?.image_url)

  return (
    <Box
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
    >
      <Box
        as="article"
        overflow="hidden"
        borderRadius="2xl"
        border="1px"
        borderColor="whiteAlpha.600"
        bg="whiteAlpha.800"
        backdropFilter="blur(8px)"
        boxShadow="0 4px 20px rgba(0,0,0,0.05)"
        transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          transform: "translateY(-4px)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
          borderColor: "blue.200",
        }}
        role="group"
        cursor="pointer"
      >
        <Box aspectRatio={1} overflow="hidden" bg="gray.100">
          {firstImageUrl ? (
            <Image
              src={firstImageUrl}
              alt={listing.title}
              w="full"
              h="full"
              objectFit="cover"
              transition="transform 0.3s"
              _groupHover={{ transform: "scale(1.05)" }}
            />
          ) : (
            <Flex
              h="full"
              align="center"
              justify="center"
              fontSize="xs"
              color="gray.400"
            >
              Chưa có ảnh
            </Flex>
          )}
        </Box>

        <Box p={3} display="flex" flexDir="column" gap={2}>
          <Tooltip content={listing.title} showArrow>
            <Heading
              as="h3"
              fontSize="sm"
              fontWeight="semibold"
              color="gray.900"
              lineClamp={1}
            >
              {listing.title}
            </Heading>
          </Tooltip>

          <Flex align="center" gap={1} fontSize="xs" color="gray.600">
            <Box as={FiUser} w="3.5" h="3.5" />
            <Link
              to="/sellers/$id"
              params={{ id: listing.seller_id }}
              onClick={(event) => {
                event.stopPropagation()
              }}
              style={{ textDecoration: "none" }}
            >
              <Text
                lineClamp={1}
                color="blue.600"
                _hover={{ textDecoration: "underline" }}
                mr={1}
              >
                {seller?.full_name || "Người bán"}
              </Text>
            </Link>

            <Badge
              colorPalette={isSellerOnline ? "green" : "gray"}
              variant="subtle"
              borderRadius="full"
              px={1.5}
              py={0.5}
              fontSize="9px"
            >
              {isSellerOnline ? "Online" : "Offline"}
            </Badge>

            {seller && seller.rating_count > 0 && (
              <Flex
                align="center"
                gap={0.5}
                color="orange.500"
                fontSize="xs"
                fontWeight="medium"
                title={`${seller.rating_count} đánh giá`}
              >
                <Box as={FiStar} w="3" h="3" fill="currentColor" />
                <Text>{seller.rating_avg.toFixed(1)}</Text>
              </Flex>
            )}
          </Flex>

          <Text
            fontSize="lg"
            fontWeight="bold"
            bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
            bgClip="text"
            color="transparent"
            display="inline-block"
            lineHeight="none"
          >
            {formatCurrencyVnd(listing.price)}
          </Text>

          <Flex align="center" gap={1} fontSize="xs" color="gray.500">
            <Box as={FiTag} w="3.5" h="3.5" />
            <Text lineClamp={1}>
              {category?.name ?? "Danh mục chưa xác định"}
            </Text>
          </Flex>

          <Flex
            align="center"
            justify="space-between"
            fontSize="xs"
            color="gray.500"
          >
            <Text>{listing.condition_grade.replace(/_/g, " ")}</Text>
            <Text>{formatPostedTime(listing.created_at)}</Text>
          </Flex>
        </Box>
      </Box>
    </Box>
  )
}
