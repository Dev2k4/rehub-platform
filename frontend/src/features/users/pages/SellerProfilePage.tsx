import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  HStack,
  Spinner,
  SimpleGrid,
  Separator,
  Image,
} from "@chakra-ui/react"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiMapPin,
  FiStar,
  FiCheckCircle,
  FiAlertCircle,
  FiShoppingBag,
  FiFileText,
} from "react-icons/fi"
import { getUserPublicProfile, getSellerListings } from "@/features/users/api/users.api"
import { getCategoriesTree } from "@/features/home/api/marketplace.api"
import { ListingCard } from "@/features/users/components/ListingCard"
import { flattenCategories } from "@/features/home/utils/marketplace.utils"
import type { CategoryTree } from "@/client"

function StarRating({ score }: { score: number }) {
  const maxStars = 5
  const filledStars = Math.round(score)
  return (
    <HStack gap={1}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Box
          key={i}
          as={FiStar}
          w={4}
          h={4}
          color={i < filledStars ? "yellow.400" : "gray.300"}
          fill={i < filledStars ? "currentColor" : "none"}
        />
      ))}
      <Text fontSize="sm" color="gray.600" ml={1}>
        {score.toFixed(1)} / 5
      </Text>
    </HStack>
  )
}

function TrustScoreBadge({ score }: { score: number }) {
  let color = "gray"
  let label = "Chưa xác định"

  if (score >= 80) {
    color = "green"
    label = "Rất uy tín"
  } else if (score >= 60) {
    color = "teal"
    label = "Uy tín"
  } else if (score >= 40) {
    color = "yellow"
    label = "Bình thường"
  } else if (score > 0) {
    color = "orange"
    label = "Cần cải thiện"
  }

  return (
    <Badge colorPalette={color as any} variant="subtle" px={2} py={0.5} borderRadius="full">
      {label} ({score}%)
    </Badge>
  )
}

export function SellerProfilePage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: "/sellers/$id" })

  const profileQuery = useQuery({
    queryKey: ["seller-profile", id],
    queryFn: () => getUserPublicProfile(id),
    enabled: !!id,
  })

  const listingsQuery = useQuery({
    queryKey: ["seller-listings", id],
    queryFn: () => getSellerListings({ sellerId: id, limit: 12 }),
    enabled: !!id,
  })

  const categoriesQuery = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => getCategoriesTree(),
  })

  const categoryMap = new Map<string, CategoryTree>()
  if (categoriesQuery.data) {
    flattenCategories(categoriesQuery.data).forEach((cat) => {
      categoryMap.set(cat.id, cat)
    })
  }

  if (profileQuery.isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
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
          <Box bg="white" borderRadius="xl" p={8} textAlign="center" boxShadow="sm">
            <Box as={FiAlertCircle} w={12} h={12} color="red.400" mx="auto" mb={4} />
            <Heading as="h2" size="lg" color="gray.900" mb={2}>
              Không tìm thấy người bán
            </Heading>
            <Text color="gray.500">Người bán này không tồn tại hoặc đã bị vô hiệu hóa.</Text>
          </Box>
        </Container>
      </Box>
    )
  }

  const profile = profileQuery.data
  const listings = listingsQuery.data?.items ?? []

  const locationParts = [profile.district, profile.province].filter(Boolean)
  const location = locationParts.length > 0 ? locationParts.join(", ") : null

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
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

        {/* Profile Card */}
        <Box bg="white" borderRadius="xl" boxShadow="sm" overflow="hidden" mb={8}>
          {/* Cover */}
          <Box bg="blue.600" h={24} />

          {/* Profile Header */}
          <Box px={8} mt={-11} pb={6} position="relative" zIndex={10}>
            <Flex align="flex-end" gap={6} mb={4}>
              {/* Avatar */}
              <Box
                w="88px"
                h="88px"
                bg="white"
                border="4px solid"
                borderColor="white"
                borderRadius="full"
                boxShadow="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgColor="gray.100"
                flexShrink={0}
              >
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    w="full"
                    h="full"
                    objectFit="cover"
                    borderRadius="full"
                  />
                ) : (
                  <FiUser size={36} color="#9ca3af" />
                )}
              </Box>

              {/* Name & Trust */}
              <Box pb={1} flex={1}>
                <HStack gap={4} align="center" flexWrap="wrap">
                  <Heading as="h1" size="lg" color="gray.900">
                    {profile.full_name}
                  </Heading>
                  <TrustScoreBadge score={profile.trust_score} />
                </HStack>
                {location && (
                  <HStack gap={1} mt={1}>
                    <Box as={FiMapPin} w={4} h={4} color="gray.400" />
                    <Text fontSize="sm" color="gray.500">
                      {location}
                    </Text>
                  </HStack>
                )}
              </Box>
            </Flex>

            {/* Stats Row */}
            <Flex gap={6} bg="gray.50" borderRadius="lg" p={4} wrap="wrap">
              <Box textAlign="center" minW="80px">
                <Text fontSize="xl" fontWeight="bold" color="gray.800">
                  {profile.completed_orders}
                </Text>
                <Text fontSize="xs" color="gray.500" mt={0.5}>
                  Đơn hoàn thành
                </Text>
              </Box>
              <Separator orientation="vertical" h="auto" />
              <Box>
                <StarRating score={profile.rating_avg} />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Đánh giá ({profile.rating_count})
                </Text>
              </Box>
              <Separator orientation="vertical" h="auto" />
              <Box textAlign="center" minW="80px">
                <HStack gap={1} justify="center">
                  <Box as={FiCheckCircle} w={5} h={5} color="green.500" />
                  <Text fontSize="xl" fontWeight="bold" color="gray.800">
                    {profile.trust_score}%
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={0.5}>
                  Độ tin cậy
                </Text>
              </Box>
              <Separator orientation="vertical" h="auto" />
              <Box textAlign="center" minW="80px">
                <HStack gap={1} justify="center">
                  <Box as={FiCalendar} w={4} h={4} color="gray.400" />
                </HStack>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Thành viên từ{" "}
                  {new Date(profile.created_at).toLocaleDateString("vi-VN", {
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Bio Section */}
          {profile.bio && (
            <>
              <Separator />
              <Box px={8} py={5}>
                <HStack gap={2} mb={2}>
                  <Box as={FiFileText} w={4} h={4} color="gray.400" />
                  <Text
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.600"
                    textTransform="uppercase"
                    letterSpacing="wider"
                  >
                    Giới thiệu
                  </Text>
                </HStack>
                <Text color="gray.700" fontSize="sm" lineHeight={1.8}>
                  {profile.bio}
                </Text>
              </Box>
            </>
          )}
        </Box>

        {/* Seller's Listings */}
        <Box>
          <Flex align="center" justify="space-between" mb={4}>
            <HStack gap={2}>
              <Box as={FiShoppingBag} w={5} h={5} color="gray.600" />
              <Heading as="h2" size="md" color="gray.900">
                Sản phẩm đang bán
              </Heading>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              {listingsQuery.data?.total ?? 0} sản phẩm
            </Text>
          </Flex>

          {listingsQuery.isLoading ? (
            <Flex justify="center" py={8}>
              <Spinner size="lg" color="blue.500" />
            </Flex>
          ) : listings.length === 0 ? (
            <Box
              bg="white"
              borderRadius="xl"
              p={8}
              textAlign="center"
              boxShadow="sm"
              border="1px"
              borderColor="gray.200"
            >
              <Box as={FiShoppingBag} w={10} h={10} color="gray.300" mx="auto" mb={3} />
              <Text color="gray.500">Người bán chưa có sản phẩm nào đang bán.</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 2, sm: 2, lg: 3, xl: 4 }} gap={3}>
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} categoryMap={categoryMap} />
              ))}
            </SimpleGrid>
          )}
        </Box>
      </Container>
    </Box>
  )
}
