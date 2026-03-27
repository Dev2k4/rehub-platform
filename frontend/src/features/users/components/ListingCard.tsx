import { FiTag } from "react-icons/fi"
import { Box, Heading, Text, Flex, Image } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import type { CategoryTree, ListingWithImages } from "@/client"
import {
  formatCurrencyVnd,
  formatPostedTime,
  getListingImageUrl,
} from "@/features/home/utils/marketplace.utils"

type ListingCardProps = {
  listing: ListingWithImages
  categoryMap: Map<string, CategoryTree>
}

export function ListingCard({ listing, categoryMap }: ListingCardProps) {
  const category = categoryMap.get(listing.category_id)
  const firstImageUrl = getListingImageUrl(listing.images?.[0]?.image_url)

  return (
    <Link to="/listings/$id" params={{ id: listing.id }} style={{ textDecoration: "none" }}>
      <Box
        as="article"
        overflow="hidden"
        borderRadius="2xl"
        border="1px"
        borderColor="gray.200"
        bg="white"
        boxShadow="sm"
        transition="all 0.2s"
        _hover={{ transform: "translateY(-2px)", boxShadow: "md" }}
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
            <Flex h="full" align="center" justify="center" fontSize="xs" color="gray.400">
              Chưa có ảnh
            </Flex>
          )}
        </Box>

        <Box p={3} display="flex" flexDir="column" gap={2}>
          <Heading
            as="h3"
            fontSize="sm"
            fontWeight="semibold"
            color="gray.900"
            lineClamp={2}
            minH="40px"
          >
            {listing.title}
          </Heading>

          <Text fontSize="lg" fontWeight="bold" color="blue.600" lineHeight="none">
            {formatCurrencyVnd(listing.price)}
          </Text>

          <Flex align="center" gap={1} fontSize="xs" color="gray.500">
            <Box as={FiTag} w="3.5" h="3.5" />
            <Text lineClamp={1}>{category?.name ?? "Danh mục chưa xác định"}</Text>
          </Flex>

          <Flex align="center" justify="space-between" fontSize="xs" color="gray.500">
            <Text>{listing.condition_grade.replace(/_/g, " ")}</Text>
            <Text>{formatPostedTime(listing.created_at)}</Text>
          </Flex>
        </Box>
      </Box>
    </Link>
  )
}
