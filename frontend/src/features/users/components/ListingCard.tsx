import {
  Badge,
  Box,
  Flex,
  Heading,
  HStack,
  Image,
  Text,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiTag } from "react-icons/fi"
import type {
  CategoryTree,
  ListingWithImages,
  UserPublicProfile,
} from "@/client"
import {
  formatCurrencyVnd,
  formatPostedTime,
  getListingImageUrl,
} from "@/features/home/utils/marketplace.utils"

type ListingCardProps = {
  listing: ListingWithImages
  categoryMap: Map<string, CategoryTree>
  seller?: UserPublicProfile
}

export function ListingCard({
  listing,
  categoryMap,
}: ListingCardProps) {
  const category = categoryMap.get(listing.category_id)
  const firstImageUrl = getListingImageUrl(listing.images?.[0]?.image_url)

  return (
    <Link
      to="/listings/$id"
      params={{ id: listing.id }}
      style={{ textDecoration: "none" }}
    >
      <Box
        as="article"
        overflow="hidden"
        borderRadius="1rem"
        bg="white"
        border="1px solid"
        borderColor="#018ABE"
        transition="all 0.2s ease-in-out"
        _hover={{
          transform: "translateY(-4px)",
          borderColor: "#02457A",
          boxShadow: "0 12px 20px rgba(1,138,190,0.15)",
        }}
        height="100%"
        display="flex"
        flexDirection="column"
      >
        <Box
          position="relative"
          aspectRatio={1}
          overflow="hidden"
          bg="gray.100"
        >
          <Image
            src={firstImageUrl}
            alt={listing.title}
            objectFit="cover"
            w="100%"
            h="100%"
          />
          <Badge
            position="absolute"
            top="0.75rem"
            left="0.75rem"
            bg="rgba(0,0,0,0.7)"
            color="white"
            borderRadius="0.5rem"
            px="0.5rem"
            fontSize="0.65rem"
          >
            {listing.condition_grade.replace(/_/g, " ")}
          </Badge>
        </Box>

        <Flex p="1rem" direction="column" gap="0.5rem" flex="1">
          <Heading size="xs" color="gray.800" lineClamp={2} h="2.5rem">
            {listing.title}
          </Heading>

          <Text fontSize="1.1rem" fontWeight="800" color="blue.600">
            {formatCurrencyVnd(listing.price)}
          </Text>

          <Flex align="center" gap="0.5rem" mt="auto">
            <HStack gap="0.25rem" color="gray.500" fontSize="0.7rem">
              <FiTag size={12} />
              <Text>{category?.name ?? "Đồ cũ"}</Text>
            </HStack>
          </Flex>

          <Flex
            justify="flex-end"
            align="center"
            pt="0.5rem"
            borderTop="1px solid"
            borderColor="gray.100"
          >
            <Text fontSize="0.65rem" color="gray.400">
              {formatPostedTime(listing.created_at)}
            </Text>
          </Flex>
        </Flex>
      </Box>
    </Link>
  )
}
