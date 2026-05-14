import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Image,
  Separator,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "@tanstack/react-router"
import {
  FiAlertCircle,
  FiArrowLeft,
  FiAward,
  FiCalendar,
  FiFileText,
  FiMapPin,
  FiMessageCircle,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiUser,
  FiZap,
} from "react-icons/fi"
import type { CategoryTree } from "@/client"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { openChatWidget } from "@/features/chat/chat-widget.events"
import { getCategoriesTree } from "@/features/home/api/marketplace.api"
import { flattenCategories } from "@/features/home/utils/marketplace.utils"
import { DeliveryRouteMap } from "@/features/orders/components/DeliveryRouteMap"
import { ReviewsList } from "@/features/reviews/components/ReviewsList"
import { useUserReviews } from "@/features/reviews/hooks/useReviews"
import { useIsUserOnline } from "@/features/shared/realtime/ws.provider"
import {
  getSellerListings,
  getUserPublicProfile,
} from "@/features/users/api/users.api"
import { ListingCard } from "@/features/users/components/ListingCard"

export function SellerProfilePage() {
  const navigate = useNavigate()
  const { id } = useParams({ from: "/sellers/$id" })
  const { isAuthenticated } = useAuthUser()
  const [timeFilter, setTimeFilter] = useState<"all" | "7d" | "24d" | "older">("all")

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

  const reviewsQuery = useUserReviews(id)

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

  const profile = profileQuery.data
  const isSellerOnline = useIsUserOnline(profile?.id ?? "")

  if (profileQuery.isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  if (profileQuery.isError || !profile) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container
          maxW="1440px"
          mx="auto"
          px={{ base: "1rem", md: "2%" }}
          py={8}
        >
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
              Không tìm thấy người bán
            </Heading>
            <Text color="gray.500">
              Người bán này không tồn tại hoặc đã bị vô hiệu hóa.
            </Text>
          </Box>
        </Container>
      </Box>
    )
  }

  const listings = useMemo(() => {
    const raw = listingsQuery.data?.items ?? []
    if (timeFilter === "all") return raw
    const now = new Date()
    if (timeFilter === "older") {
      const threshold = new Date(now.getTime() - 24 * 24 * 60 * 60 * 1000)
      return raw.filter((item) => new Date(item.created_at) < threshold)
    }
    const days = timeFilter === "7d" ? 7 : 24
    const threshold = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    return raw.filter((item) => new Date(item.created_at) >= threshold)
  }, [listingsQuery.data?.items, timeFilter])

  const locationParts = [profile.district, profile.province].filter(Boolean)
  const location = locationParts.length > 0 ? locationParts.join(", ") : null

  const handleOpenChat = () => {
    if (!isAuthenticated) {
      navigate({ to: "/auth/login" })
      return
    }
    openChatWidget(profile.id)
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="1440px" mx="auto" px={{ base: "1rem", md: "2%" }} py={8}>
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
        <Box
          bg="white"
          borderRadius="2xl"
          boxShadow="0 8px 32px rgba(0,0,0,0.07)"
          overflow="hidden"
          mb={8}
          border="1px solid"
          borderColor="gray.100"
        >
          {/* Cover — gradient */}
          <Box
            h={36}
            position="relative"
            overflow="hidden"
            style={{
              background:
                "linear-gradient(135deg, #02457A 0%, #018ABE 50%, #97CADB 100%)",
            }}
          >
            <Box
              position="absolute"
              top="-40px"
              left="-40px"
              w="180px"
              h="180px"
              borderRadius="full"
              bg="whiteAlpha.200"
              filter="blur(30px)"
            />
            <Box
              position="absolute"
              top="10px"
              right="20%"
              w="100px"
              h="100px"
              borderRadius="full"
              bg="whiteAlpha.100"
              filter="blur(20px)"
            />
          </Box>

          {/* Profile Header */}
          <Box px={{ base: 4, sm: 8 }} pt={0} pb={6} position="relative" zIndex={10}>
            <Flex 
              direction={{ base: "column", lg: "row" }} 
              align={{ base: "center", lg: "flex-start" }} 
              justify="space-between"
              gap={6}
            >
              {/* Left Side: Avatar + Info */}
              <Flex 
                direction={{ base: "column", sm: "row" }} 
                align={{ base: "center", sm: "center" }} 
                gap={5}
                flex={1}
              >
                {/* Avatar overlays cover cleanly */}
                <Box
                  mt={{ base: "-44px", sm: "-50px" }}
                  w="100px"
                  h="100px"
                  bg="white"
                  border="4px solid"
                  borderColor="white"
                  borderRadius="full"
                  boxShadow="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  bgColor="gray.100"
                  flexShrink={0}
                  position="relative"
                  zIndex={2}
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
                    <FiUser size={40} color="#9ca3af" />
                  )}
                </Box>

                {/* Name & Badges & Action sit entirely on clean white background */}
                <Box pt={{ base: 0, sm: 2 }} textAlign={{ base: "center", sm: "left" }}>
                  <HStack gap={2} align="center" justify={{ base: "center", sm: "flex-start" }} flexWrap="wrap" mb={1.5}>
                    <Heading as="h1" size="lg" color="gray.900" fontWeight="bold">
                      {profile.full_name}
                    </Heading>
                    <Badge
                      colorPalette={isSellerOnline ? "green" : "gray"}
                      variant="subtle"
                      px={2}
                      py={0.5}
                      borderRadius="full"
                    >
                      {isSellerOnline ? (
                        <>
                          <Box
                            as="span"
                            display="inline-block"
                            w={2}
                            h={2}
                            bg="green.500"
                            borderRadius="full"
                            mr={1.5}
                          />{" "}
                          Online
                        </>
                      ) : (
                        <>
                          <Box
                            as="span"
                            display="inline-block"
                            w={2}
                            h={2}
                            bg="gray.400"
                            borderRadius="full"
                            mr={1.5}
                          />{" "}
                          Offline
                        </>
                      )}
                    </Badge>
                    {profile.trust_score >= 60 && (
                      <Badge
                        colorPalette="blue"
                        variant="subtle"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        fontSize="xs"
                      >
                        <FiShield
                          size={12}
                          style={{ display: "inline", marginRight: "4px" }}
                        />
                        Đã xác minh
                      </Badge>
                    )}
                    {profile.trust_score >= 80 && (
                      <Badge
                        colorPalette="yellow"
                        variant="subtle"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        fontSize="xs"
                      >
                        <FiAward
                          size={12}
                          style={{ display: "inline", marginRight: "4px" }}
                        />
                        Top Seller
                      </Badge>
                    )}
                    {profile.completed_orders >= 10 && (
                      <Badge
                        colorPalette="purple"
                        variant="subtle"
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        fontSize="xs"
                      >
                        <FiZap
                          size={12}
                          style={{ display: "inline", marginRight: "4px" }}
                        />
                        Phản hồi nhanh
                      </Badge>
                    )}
                  </HStack>
                  {location && (
                    <HStack gap={1} justify={{ base: "center", sm: "flex-start" }}>
                      <Box as={FiMapPin} w={4} h={4} color="gray.400" />
                      <Text fontSize="sm" color="gray.500">
                        {location}
                      </Text>
                    </HStack>
                  )}

                  {/* Chat Action Button */}
                  <Box mt={3}>
                    <Button
                      colorPalette="blue"
                      borderRadius="xl"
                      px={6}
                      size="sm"
                      className="btn-shine"
                      style={{ 
                        background: "linear-gradient(135deg, #02457A 0%, #018ABE 100%)",
                        color: "white",
                        position: "relative", 
                        overflow: "hidden",
                        fontWeight: "bold",
                      }}
                      boxShadow="0 4px 12px rgba(2,69,122,0.25)"
                      _hover={{ transform: "translateY(-1px)", opacity: 0.95 }}
                      transition="all 0.2s"
                      onClick={handleOpenChat}
                    >
                      <FiMessageCircle size={16} style={{ marginRight: "6px" }} />
                      Nhắn tin ngay
                    </Button>
                  </Box>
                </Box>
              </Flex>

              {/* Right Side: Map Widget Column in compact mode */}
              {profile.province && (
                <Box 
                  mt={{ base: 4, lg: 3 }}
                  w={{ base: "full", sm: "320px" }} 
                  h="140px" 
                  borderRadius="xl" 
                  overflow="hidden" 
                  border="1px" 
                  borderColor="gray.200"
                  flexShrink={0}
                  boxShadow="sm"
                  alignSelf={{ base: "center", lg: "flex-start" }}
                >
                  <DeliveryRouteMap 
                    sellerProvince={profile.province}
                    sellerDistrict={profile.district || undefined}
                    buyerProvince={profile.province}
                    buyerDistrict={profile.district || undefined}
                    compact={true}
                  />
                </Box>
              )}
            </Flex>

            {/* Safe Trading Trust Box */}
           

            {/* Stat Cards */}
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mt={4}>
              <Box
                className="stat-card animate-fadeinup delay-0"
                p="0.85rem"
                border="1px solid"
                borderColor="#018ABE"
                borderRadius="xl"
                transition="all 0.2s"
                _hover={{ borderColor: "#02457A", boxShadow: "sm" }}
              >
                <div
                  className="stat-card-icon"
                  style={{
                    background: "#EFF6FF",
                    width: "1.75rem",
                    height: "1.75rem",
                  }}
                >
                  <FiShoppingBag size={14} color="#2563eb" />
                </div>
                <div className="stat-card-value" style={{ fontSize: "1.3rem" }}>
                  {profile.completed_orders}
                </div>
                <div className="stat-card-label">Đơn hoàn thành</div>
              </Box>
              <Box
                className="stat-card animate-fadeinup delay-1"
                p="0.85rem"
                border="1px solid"
                borderColor="#018ABE"
                borderRadius="xl"
                transition="all 0.2s"
                _hover={{ borderColor: "#02457A", boxShadow: "sm" }}
              >
                <div
                  className="stat-card-icon"
                  style={{
                    background: "#FFFBEB",
                    width: "1.75rem",
                    height: "1.75rem",
                  }}
                >
                  <FiStar size={14} color="#f59e0b" />
                </div>
                <div
                  className="stat-card-value"
                  style={{ fontSize: "1.3rem", color: "#f59e0b" }}
                >
                  {profile.rating_avg.toFixed(1)}
                </div>
                <div className="stat-card-label">
                  Đánh giá ({profile.rating_count})
                </div>
              </Box>
              <Box
                className="stat-card animate-fadeinup delay-2"
                p="0.85rem"
                border="1px solid"
                borderColor="#018ABE"
                borderRadius="xl"
                transition="all 0.2s"
                _hover={{ borderColor: "#02457A", boxShadow: "sm" }}
              >
                <div
                  className="stat-card-icon"
                  style={{
                    background: "#F0FDF4",
                    width: "1.75rem",
                    height: "1.75rem",
                  }}
                >
                  <FiZap size={14} color="#10b981" />
                </div>
                <div
                  className="stat-card-value"
                  style={{ fontSize: "1.3rem", color: "#10b981" }}
                >
                  {profile.trust_score}%
                </div>
                <div className="stat-card-label">Độ tin cậy</div>
              </Box>
              <Box
                className="stat-card animate-fadeinup delay-3"
                p="0.85rem"
                border="1px solid"
                borderColor="#018ABE"
                borderRadius="xl"
                transition="all 0.2s"
                _hover={{ borderColor: "#02457A", boxShadow: "sm" }}
              >
                <div
                  className="stat-card-icon"
                  style={{
                    background: "#F5F3FF",
                    width: "1.75rem",
                    height: "1.75rem",
                  }}
                >
                  <FiCalendar size={14} color="#7c3aed" />
                </div>
                <div
                  className="stat-card-value"
                  style={{
                    fontSize: "0.8rem",
                    color: "#7c3aed",
                    fontWeight: "700",
                  }}
                >
                  {new Date(profile.created_at).toLocaleDateString("vi-VN", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
                <div className="stat-card-label">Thành viên từ</div>
              </Box>
            </SimpleGrid>
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
            <HStack gap={3}>
              <HStack gap={1} bg="white" p={1} borderRadius="lg" border="1px solid" borderColor="gray.200">
                <Button
                  size="2xs"
                  variant={timeFilter === "all" ? "solid" : "ghost"}
                  colorPalette={timeFilter === "all" ? "blue" : "gray"}
                  onClick={() => setTimeFilter("all")}
                  borderRadius="md"
                  px={3}
                >
                  Tất cả
                </Button>
                <Button
                  size="2xs"
                  variant={timeFilter === "7d" ? "solid" : "ghost"}
                  colorPalette={timeFilter === "7d" ? "blue" : "gray"}
                  onClick={() => setTimeFilter("7d")}
                  borderRadius="md"
                  px={3}
                >
                  7 ngày
                </Button>
                <Button
                  size="2xs"
                  variant={timeFilter === "24d" ? "solid" : "ghost"}
                  colorPalette={timeFilter === "24d" ? "blue" : "gray"}
                  onClick={() => setTimeFilter("24d")}
                  borderRadius="md"
                  px={3}
                >
                  24 ngày
                </Button>
                <Button
                  size="2xs"
                  variant={timeFilter === "older" ? "solid" : "ghost"}
                  colorPalette={timeFilter === "older" ? "blue" : "gray"}
                  onClick={() => setTimeFilter("older")}
                  borderRadius="md"
                  px={3}
                >
                  Cũ hơn
                </Button>
              </HStack>
              <Text fontSize="sm" color="gray.500">
                {listings.length} / {listingsQuery.data?.total ?? 0} sản phẩm
              </Text>
            </HStack>
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
              <Box
                as={FiShoppingBag}
                w={10}
                h={10}
                color="gray.300"
                mx="auto"
                mb={3}
              />
              <Text color="gray.500">
                Người bán chưa có sản phẩm nào đang bán.
              </Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 2, sm: 2, lg: 3, xl: 4 }} gap={3}>
              {listings.map((listing: any) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  categoryMap={categoryMap}
                />
              ))}
            </SimpleGrid>
          )}
        </Box>

        <Box mt={8}>
          <Flex align="center" justify="space-between" mb={4}>
            <HStack gap={2}>
              <Box as={FiStar} w={5} h={5} color="gray.600" />
              <Heading as="h2" size="md" color="gray.900">
                Đánh giá người bán
              </Heading>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              {reviewsQuery.data?.length ?? 0} đánh giá
            </Text>
          </Flex>

          <ReviewsList
            reviews={reviewsQuery.data ?? []}
            isLoading={reviewsQuery.isLoading}
            emptyText="Người bán chưa có đánh giá nào."
          />
        </Box>
      </Container>
    </Box>
  )
}
