// import { Box, Flex, Heading, Image, Text } from "@chakra-ui/react"
// import { Link } from "@tanstack/react-router"
// import { FiStar, FiTag } from "react-icons/fi"
// import type { CategoryTree, ListingWithImages } from "@/client"
// import { Tooltip } from "@/components/ui/tooltip"
// import {
//   formatCurrencyVnd,
//   formatPostedTime,
//   getListingImageUrl,
// } from "@/features/home/utils/marketplace.utils"

// type ListingCardProps = {
//   listing: ListingWithImages
//   categoryMap: Map<string, CategoryTree>
// }

// export function ListingCard({
//   listing,
//   categoryMap,
//   seller,
// }: ListingCardProps & { seller?: import("@/client").UserPublicProfile }) {
//   const category = categoryMap.get(listing.category_id)
//   const firstImageUrl = getListingImageUrl(listing.images?.[0]?.image_url)

//   return (
//     <Link
//       to="/listings/$id"
//       params={{ id: listing.id }}
//       style={{ textDecoration: "none" }}
//     >
//       <Box
//         as="article"
//         overflow="hidden"
//         borderRadius="2xl"
//         border="1px"
//         borderColor="whiteAlpha.600"
//         bg="whiteAlpha.800"
//         backdropFilter="blur(8px)"
//         boxShadow="0 4px 20px rgba(0,0,0,0.05)"
//         transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
//         _hover={{
//           transform: "translateY(-4px)",
//           boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
//           borderColor: "blue.200",
//         }}
//         role="group"
//         cursor="pointer"
//       >
//         <Box aspectRatio={1} overflow="hidden" bg="gray.100">
//           {firstImageUrl ? (
//             <Image
//               src={firstImageUrl}
//               alt={listing.title}
//               w="full"
//               h="full"
//               objectFit="cover"
//               transition="transform 0.3s"
//               _groupHover={{ transform: "scale(1.05)" }}
//             />
//           ) : (
//             <Flex
//               h="full"
//               align="center"
//               justify="center"
//               fontSize="xs"
//               color="gray.400"
//             >
//               Chưa có ảnh
//             </Flex>
//           )}
//         </Box>

//         <Box p={3} display="flex" flexDir="column" gap={2}>
//           <Tooltip content={listing.title} showArrow>
//             <Heading
//               as="h3"
//               fontSize="sm"
//               fontWeight="semibold"
//               color="gray.900"
//               lineClamp={1}
//             >
//               {listing.title}
//             </Heading>
//           </Tooltip>

//           <Text
//             fontSize="lg"
//             fontWeight="bold"
//             bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
//             color="transparent"
//             bgClip="text"
//             display="inline-block"
//             lineHeight="none"
//           >
//             {formatCurrencyVnd(listing.price)}
//           </Text>

//           <Flex align="center" gap={1} fontSize="xs" color="gray.500">
//             <Box as={FiTag} w="3.5" h="3.5" />
//             <Text lineClamp={1} flex={1}>
//               {category?.name ?? "Danh mục chưa xác định"}
//             </Text>

//             {seller && seller.rating_count > 0 && (
//               <Flex
//                 align="center"
//                 gap={0.5}
//                 color="orange.500"
//                 fontSize="xs"
//                 fontWeight="medium"
//                 title={`${seller.rating_count} đánh giá`}
//               >
//                 <Box as={FiStar} w="3" h="3" fill="currentColor" />
//                 <Text>{seller.rating_avg.toFixed(1)}</Text>
//               </Flex>
//             )}
//           </Flex>

//           <Flex
//             align="center"
//             justify="space-between"
//             fontSize="xs"
//             color="gray.500"
//           >
//             <Text>{listing.condition_grade.replace(/_/g, " ")}</Text>
//             <Text>{formatPostedTime(listing.created_at)}</Text>
//           </Flex>
//         </Box>
//       </Box>
//     </Link>
//   )
// }

import { Box, Flex, Heading, Image, Text, Badge, HStack } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiStar, FiTag, FiMapPin } from "react-icons/fi"
import type { CategoryTree, ListingWithImages, UserPublicProfile } from "@/client"
import { Tooltip } from "@/components/ui/tooltip"
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

export function ListingCard({ listing, categoryMap, seller }: ListingCardProps) {
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
        // SỬA TẠI ĐÂY: Thêm viền rõ rệt để tách biệt với nền xám nhạt
        border="1px solid"
        borderColor="gray.200" 
        transition="all 0.2s ease-in-out"
        _hover={{
          transform: "translateY(-4px)",
          borderColor: "blue.300", // Đổi màu viền khi hover để tạo điểm nhấn
          boxShadow: "0 12px 20px rgba(0,0,0,0.08)",
        }}
        height="100%"
        display="flex"
        flexDirection="column"
      >
        <Box position="relative" aspectRatio={1} overflow="hidden" bg="gray.100">
          <Image
            src={firstImageUrl}
            alt={listing.title}
            objectFit="cover"
            w="100%"
            h="100%"
            // fallbackSrc="https://via.placeholder.com/400?text=ReHub"
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
                <Text  >{category?.name ?? "Đồ cũ"}</Text>
             </HStack>
          </Flex>
          
          <Flex justify="space-between" align="center" pt="0.5rem" borderTop="1px solid" borderColor="gray.100">
             <Text fontSize="0.65rem" color="gray.400">{formatPostedTime(listing.created_at)}</Text>
             <HStack gap="0.25rem" color="orange.500">
                <FiStar fill="currentColor" size={10} />
                <Text fontSize="0.7rem" fontWeight="bold">{seller?.rating_avg.toFixed(1) ?? "5.0"}</Text>
             </HStack>
          </Flex>
        </Flex>
      </Box>
    </Link>
  )
}