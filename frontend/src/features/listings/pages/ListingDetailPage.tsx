import { useState } from "react"
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Button,
  Badge,
  VStack,
  HStack,
  Spinner,
  Image,
  SimpleGrid,
  Separator,
} from "@chakra-ui/react"
import { useNavigate, useParams, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  FiArrowLeft,
  FiTag,
  FiUser,
  FiCalendar,
  FiMessageCircle,
  FiHeart,
  FiShare2,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi"
import type { CategoryTree } from "@/client"
import { getListingDetails } from "@/features/listings/api/listings.api"
import { getCategoriesTree } from "@/features/home/api/marketplace.api"
import {
  formatCurrencyVnd,
  formatPostedTime,
  getListingImageUrl,
  flattenCategories,
} from "@/features/home/utils/marketplace.utils"

const CONDITION_LABELS: Record<string, { label: string; color: string }> = {
  brand_new: { label: "Mới 100%", color: "green" },
  like_new: { label: "Như mới", color: "teal" },
  good: { label: "Tốt", color: "blue" },
  fair: { label: "Khá", color: "yellow" },
  poor: { label: "Cũ", color: "gray" },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Đang bán", color: "green" },
  pending: { label: "Chờ duyệt", color: "yellow" },
  sold: { label: "Đã bán", color: "gray" },
  hidden: { label: "Ẩn", color: "gray" },
  rejected: { label: "Bị từ chối", color: "red" },
}

export function ListingDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: "/listings/$id" })
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const listingQuery = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListingDetails(id),
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

  if (listingQuery.isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  if (listingQuery.isError || !listingQuery.data) {
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
    )
  }

  const listing = listingQuery.data
  const category = categoryMap.get(listing.category_id)
  const conditionInfo = CONDITION_LABELS[listing.condition_grade] ?? {
    label: listing.condition_grade,
    color: "gray",
  }
  const statusInfo = STATUS_LABELS[listing.status] ?? {
    label: listing.status,
    color: "gray",
  }

  const images = listing.images ?? []
  const currentImage = images[selectedImageIndex]

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

        <Flex direction={{ base: "column", lg: "row" }} gap={8}>
          {/* Image Gallery */}
          <Box flex={1} minW={0}>
            <Box
              bg="white"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="sm"
              border="1px"
              borderColor="gray.200"
            >
              {/* Main Image */}
              <Box aspectRatio={1} bg="gray.100" position="relative">
                {currentImage ? (
                  <Image
                    src={getListingImageUrl(currentImage.image_url)}
                    alt={listing.title}
                    w="full"
                    h="full"
                    objectFit="contain"
                  />
                ) : (
                  <Flex
                    h="full"
                    align="center"
                    justify="center"
                    color="gray.400"
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
                <SimpleGrid columns={5} gap={2} p={3}>
                  {images.map((img, index) => (
                    <Box
                      key={img.id}
                      aspectRatio={1}
                      borderRadius="md"
                      overflow="hidden"
                      cursor="pointer"
                      border="2px"
                      borderColor={
                        index === selectedImageIndex ? "blue.500" : "gray.200"
                      }
                      onClick={() => setSelectedImageIndex(index)}
                      transition="border-color 0.2s"
                      _hover={{ borderColor: "blue.300" }}
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
            </Box>
          </Box>

          {/* Product Info */}
          <Box w={{ base: "full", lg: "400px" }} flexShrink={0}>
            <VStack gap={4} align="stretch">
              {/* Main Info Card */}
              <Box
                bg="white"
                borderRadius="xl"
                boxShadow="sm"
                border="1px"
                borderColor="gray.200"
                overflow="hidden"
              >
                <Box p={6}>
                  {/* Category */}
                  <HStack gap={2} mb={3}>
                    <Box as={FiTag} w={4} h={4} color="gray.400" />
                    <Text fontSize="sm" color="gray.500">
                      {category?.name ?? "Chưa phân loại"}
                    </Text>
                  </HStack>

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
                      bg="blue.600"
                      color="white"
                      size="lg"
                      _hover={{ bg: "blue.700" }}
                      borderRadius="lg"
                    >
                      <FiMessageCircle style={{ marginRight: "0.5rem" }} />
                      Nhắn tin cho người bán
                    </Button>
                    <HStack w="full" gap={3}>
                      <Button
                        flex={1}
                        variant="outline"
                        borderColor="gray.300"
                        color="gray.700"
                        _hover={{ bg: "gray.50" }}
                      >
                        <FiHeart style={{ marginRight: "0.5rem" }} />
                        Yêu thích
                      </Button>
                      <Button
                        flex={1}
                        variant="outline"
                        borderColor="gray.300"
                        color="gray.700"
                        _hover={{ bg: "gray.50" }}
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
                  bg="white"
                  borderRadius="xl"
                  boxShadow="sm"
                  border="1px"
                  borderColor="gray.200"
                  p={5}
                  transition="all 0.2s"
                  _hover={{ boxShadow: "md", borderColor: "blue.200" }}
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
                    alignItems="center"
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
                    >
                      <Box as={FiUser} w={6} h={6} color="blue.500" />
                    </Box>
                    <Box flex={1}>
                      <Text fontSize="sm" color="gray.600">
                        ID: {listing.seller_id.slice(0, 8)}...
                      </Text>
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
        <Box
          mt={8}
          bg="white"
          borderRadius="xl"
          boxShadow="sm"
          border="1px"
          borderColor="gray.200"
          p={6}
        >
          <Heading as="h2" size="md" color="gray.900" mb={4}>
            Mô tả sản phẩm
          </Heading>
          {listing.description ? (
            <Text color="gray.700" whiteSpace="pre-wrap" lineHeight={1.8}>
              {listing.description}
            </Text>
          ) : (
            <Text color="gray.400" fontStyle="italic">
              Người bán chưa thêm mô tả cho sản phẩm này.
            </Text>
          )}
        </Box>
      </Container>
    </Box>
  )
}
