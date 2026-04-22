// import {
//   Box,
//   Button,
//   Container,
//   Flex,
//   Heading,
//   Input,
//   SimpleGrid,
//   Text,
// } from "@chakra-ui/react"
// import { useMemo, useState } from "react"
// import type { ConditionGrade } from "@/client"
// import { toaster } from "@/components/ui/toaster"
// import { CategoryOverlay } from "@/features/home/components/CategoryOverlay"
// import { CategorySidebar } from "@/features/home/components/CategorySidebar"
// import { ListingGrid } from "@/features/home/components/ListingGrid"
// import { MarketplaceHeader } from "@/features/home/components/MarketplaceHeader"
// import { useMarketplaceData } from "@/features/home/hooks/useMarketplaceData"
// import type { ListingFormSubmitPayload } from "@/features/listings/components/ListingForm"
// import { ListingModal } from "@/features/listings/components/ListingModal"
// import {
//   useCreateListing,
//   useUploadListingImage,
// } from "@/features/listings/hooks/useMyListings"

// type ListingSortBy = "newest" | "price_asc" | "price_desc"

// export function HomeMarketplacePage() {
//   const [categoryOverlayOpen, setCategoryOverlayOpen] = useState(false)
//   const [isListingModalOpen, setIsListingModalOpen] = useState(false)
//   const {
//     selectedCategoryId,
//     setSelectedCategoryId,
//     keyword,
//     setKeyword,
//     conditionGrade,
//     setConditionGrade,
//     province,
//     setProvince,
//     district,
//     setDistrict,
//     minPrice,
//     setMinPrice,
//     maxPrice,
//     setMaxPrice,
//     sortBy,
//     setSortBy,
//     page,
//     setPage,
//     pageSize,
//     categoriesQuery,
//     listingsQuery,
//     categoryMap,
//     sellerMap,
//   } = useMarketplaceData()

//   const total = listingsQuery.data?.total ?? 0
//   const totalPages = Math.max(1, Math.ceil(total / pageSize))

//   const createMutation = useCreateListing()
//   const uploadImageMutation = useUploadListingImage()

//   const selectedCategoryName = useMemo(() => {
//     if (!selectedCategoryId) {
//       return "Tất cả sản phẩm"
//     }

//     return categoryMap.get(selectedCategoryId)?.name ?? "Danh mục"
//   }, [selectedCategoryId, categoryMap])

//   const handleCreateListing = async ({
//     data,
//     files,
//   }: ListingFormSubmitPayload) => {
//     try {
//       const created = await createMutation.mutateAsync(data)

//       for (const [index, file] of files.entries()) {
//         await uploadImageMutation.mutateAsync({
//           listingId: created.id,
//           file,
//           isPrimary: index === 0,
//         })
//       }

//       setIsListingModalOpen(false)
//       toaster.create({
//         title: "Đăng tin thành công! Sản phẩm đang chờ duyệt.",
//         type: "success",
//       })
//     } catch (error: any) {
//       toaster.create({
//         title: error?.message || "Không thể đăng tin. Vui lòng thử lại sau.",
//         type: "error",
//       })
//     }
//   }

//   return (
//     <Box minH="100vh" bg="gray.50">
//       <MarketplaceHeader
//         keyword={keyword}
//         onKeywordChange={setKeyword}
//         onOpenCategoryMenu={() => setCategoryOverlayOpen(true)}
//         onOpenListingModal={() => setIsListingModalOpen(true)}
//       />

//       <CategoryOverlay
//         open={categoryOverlayOpen}
//         categories={categoriesQuery.data ?? []}
//         selectedCategoryId={selectedCategoryId}
//         onClose={() => setCategoryOverlayOpen(false)}
//         onSelectCategory={(id) => {
//           setSelectedCategoryId(id)
//           setCategoryOverlayOpen(false)
//         }}
//       />

//       <Container maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
//         <Box
//           mb={6}
//           borderRadius="2xl"
//           p={8}
//           color="white"
//           boxShadow="0 10px 30px rgba(2,69,122,0.3)"
//           position="relative"
//           overflow="hidden"
//           style={{
//             background: "linear-gradient(135deg, #02457A 0%, #018ABE 100%)",
//           }}
//         >
//           <Text
//             fontSize="xs"
//             textTransform="uppercase"
//             letterSpacing="wider"
//             color="whiteAlpha.800"
//             fontWeight="medium"
//           >
//             Marketplace
//           </Text>
//           <Heading
//             as="h1"
//             mt={1}
//             fontSize={{ base: "2xl", md: "3xl" }}
//             fontWeight="bold"
//             color="white"
//           >
//             Khám phá sản phẩm
//           </Heading>
//           <Text
//             mt={2}
//             fontSize={{ base: "sm", md: "md" }}
//             color="whiteAlpha.900"
//             fontWeight="medium"
//           >
//             Hàng nghìn sản phẩm từ những người bán uy tín đang chờ đón bạn.
//           </Text>
//         </Box>

//         <Flex mb={4} align="center" justify="space-between" gap={3}>
//           <Heading as="h2" fontSize="lg" fontWeight="semibold" color="gray.900">
//             {selectedCategoryName}
//           </Heading>
//           <Text fontSize="sm" fontWeight="medium" color="gray.500">
//             {listingsQuery.data
//               ? `${listingsQuery.data.total} kết quả`
//               : "Đang tải..."}
//           </Text>
//         </Flex>

//         <Box
//           mb={6}
//           bg="white"
//           border="1px"
//           borderColor="gray.200"
//           borderRadius="2xl"
//           p={{ base: 4, md: 5 }}
//           boxShadow="sm"
//         >
//           <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
//             Bộ lọc
//           </Text>

//           <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
//             <Box>
//               <Text fontSize="xs" color="gray.500" mb={1}>
//                 Tỉnh/Thành phố
//               </Text>
//               <Input
//                 value={province}
//                 onChange={(e) => setProvince(e.target.value)}
//                 placeholder="Ví dụ: Hà Nội"
//                 size="sm"
//               />
//             </Box>

//             <Box>
//               <Text fontSize="xs" color="gray.500" mb={1}>
//                 Quận/Huyện
//               </Text>
//               <Input
//                 value={district}
//                 onChange={(e) => setDistrict(e.target.value)}
//                 placeholder="Ví dụ: Cầu Giấy"
//                 size="sm"
//               />
//             </Box>

//             <Box>
//               <Text fontSize="xs" color="gray.500" mb={1}>
//                 Tình trạng
//               </Text>
//               <select
//                 value={conditionGrade}
//                 onChange={(e) =>
//                   setConditionGrade(e.target.value as ConditionGrade | "")
//                 }
//                 style={{
//                   width: "100%",
//                   height: "32px",
//                   borderRadius: "8px",
//                   border: "1px solid #E2E8F0",
//                   padding: "0 8px",
//                   background: "white",
//                 }}
//               >
//                 <option value="">Tất cả</option>
//                 <option value="brand_new">Mới 100%</option>
//                 <option value="like_new">Như mới</option>
//                 <option value="good">Tốt</option>
//                 <option value="fair">Khá</option>
//                 <option value="poor">Trung bình</option>
//               </select>
//             </Box>

//             <Box>
//               <Text fontSize="xs" color="gray.500" mb={1}>
//                 Giá từ
//               </Text>
//               <Input
//                 type="number"
//                 value={minPrice}
//                 onChange={(e) => setMinPrice(e.target.value)}
//                 placeholder="0"
//                 size="sm"
//                 min={0}
//               />
//             </Box>

//             <Box>
//               <Text fontSize="xs" color="gray.500" mb={1}>
//                 Giá đến
//               </Text>
//               <Input
//                 type="number"
//                 value={maxPrice}
//                 onChange={(e) => setMaxPrice(e.target.value)}
//                 placeholder="10000000"
//                 size="sm"
//                 min={0}
//               />
//             </Box>

//             <Box>
//               <Text fontSize="xs" color="gray.500" mb={1}>
//                 Sắp xếp
//               </Text>
//               <select
//                 value={sortBy}
//                 onChange={(e) => setSortBy(e.target.value as ListingSortBy)}
//                 style={{
//                   width: "100%",
//                   height: "32px",
//                   borderRadius: "8px",
//                   border: "1px solid #E2E8F0",
//                   padding: "0 8px",
//                   background: "white",
//                 }}
//               >
//                 <option value="newest">Moi nhat</option>
//                 <option value="price_asc">Gia thap den cao</option>
//                 <option value="price_desc">Gia cao den thap</option>
//               </select>
//             </Box>
//           </SimpleGrid>

//           <Flex justify="flex-end" mt={3}>
//             <Button
//               size="sm"
//               variant="outline"
//               onClick={() => {
//                 setConditionGrade("")
//                 setProvince("")
//                 setDistrict("")
//                 setMinPrice("")
//                 setMaxPrice("")
//                 setSortBy("newest")
//               }}
//             >
//               Đặt về mặc định
//             </Button>
//           </Flex>
//         </Box>

//         <Flex direction={{ base: "column", lg: "row" }} gap={6}>
//           <CategorySidebar
//             categories={categoriesQuery.data ?? []}
//             selectedCategoryId={selectedCategoryId}
//             onSelectCategory={setSelectedCategoryId}
//           />

//           <Box as="main" flex={1} minW={0}>
//             {categoriesQuery.isLoading || listingsQuery.isLoading ? (
//               <Box
//                 borderRadius="2xl"
//                 border="1px"
//                 borderColor="gray.200"
//                 bg="white"
//                 p={8}
//                 fontSize="sm"
//                 color="gray.500"
//               >
//                 Đang tải dữ liệu...
//               </Box>
//             ) : null}

//             {categoriesQuery.isError || listingsQuery.isError ? (
//               <Box
//                 borderRadius="2xl"
//                 border="1px"
//                 borderColor="red.200"
//                 bg="red.50"
//                 p={8}
//                 fontSize="sm"
//                 color="red.700"
//               >
//                 Không thể tải dữ liệu. Vui lòng kiểm tra cấu hình VITE_API_URL
//                 và trạng thái server.
//               </Box>
//             ) : null}

//             {!categoriesQuery.isLoading &&
//             !listingsQuery.isLoading &&
//             !categoriesQuery.isError &&
//             !listingsQuery.isError ? (
//               <>
//                 <ListingGrid
//                   listings={listingsQuery.data?.items ?? []}
//                   categoryMap={categoryMap}
//                   sellerMap={sellerMap}
//                 />

//                 {total > 0 && (
//                   <Flex mt={6} align="center" justify="center" gap={3}>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() =>
//                         setPage((current) => Math.max(1, current - 1))
//                       }
//                       disabled={page <= 1}
//                     >
//                       Trang trước
//                     </Button>
//                     <Text
//                       fontSize="sm"
//                       color="gray.600"
//                       minW="92px"
//                       textAlign="center"
//                     >
//                       Trang {page}/{totalPages}
//                     </Text>
//                     <Button
//                       size="sm"
//                       variant="outline"
//                       onClick={() =>
//                         setPage((current) => Math.min(totalPages, current + 1))
//                       }
//                       disabled={page >= totalPages}
//                     >
//                       Trang sau
//                     </Button>
//                   </Flex>
//                 )}
//               </>
//             ) : null}
//           </Box>
//         </Flex>
//       </Container>

//       {/* Listing Modal */}
//       <ListingModal
//         isOpen={isListingModalOpen}
//         onOpenChange={setIsListingModalOpen}
//         onSubmit={handleCreateListing}
//         isLoading={createMutation.isPending || uploadImageMutation.isPending}
//       />
//     </Box>
//   )
// }

import {
  Button,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { toaster } from "@/components/ui/toaster"
import { CategoryOverlay } from "@/features/home/components/CategoryOverlay"
import { CategoryQuickAccess } from "@/features/home/components/CategoryQuickAccess"
import { CategorySidebar } from "@/features/home/components/CategorySidebar"
import { HeroBannerCarousel } from "@/features/home/components/HeroBannerCarousel"
import { ListingGrid } from "@/features/home/components/ListingGrid"
import { MarketplaceHeader } from "@/features/home/components/MarketplaceHeader"
import { useMarketplaceData } from "@/features/home/hooks/useMarketplaceData"
import type { ListingFormSubmitPayload } from "@/features/listings/components/ListingForm"
import { ListingModal } from "@/features/listings/components/ListingModal"
import {
  useCreateListing,
  useUploadListingImage,
} from "@/features/listings/hooks/useMyListings"

type ListingSortBy = "newest" | "price_asc" | "price_desc"

export function HomeMarketplacePage() {
  const [categoryOverlayOpen, setCategoryOverlayOpen] = useState(false)
  const [isListingModalOpen, setIsListingModalOpen] = useState(false)

  const {
    selectedCategoryId,
    setSelectedCategoryId,
    keyword,
    setKeyword,
    conditionGrade,
    setConditionGrade,
    province,
    setProvince,
    district,
    setDistrict,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    page,
    setPage,
    pageSize,
    categoriesQuery,
    listingsQuery,
    categoryMap,
    sellerMap,
    flatCategories,
  } = useMarketplaceData()

  const listings = listingsQuery.data?.items ?? []
  const totalListings = listingsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(totalListings / pageSize))
  const isLoading = categoriesQuery.isLoading || listingsQuery.isLoading

  const uniqueSellerCount = useMemo(() => {
    return new Set(listings.map((listing) => listing.seller_id)).size
  }, [listings])

  const averagePrice = useMemo(() => {
    if (listings.length === 0) {
      return 0
    }

    const total = listings.reduce((sum, listing) => {
      return sum + Number.parseFloat(String(listing.price) || "0")
    }, 0)

    return total / listings.length
  }, [listings])

  const conditionDistribution = useMemo(() => {
    const counts = {
      brand_new: 0,
      like_new: 0,
      good: 0,
      fair: 0,
      poor: 0,
    }

    for (const listing of listings) {
      const key = listing.condition_grade
      if (key in counts) {
        counts[key as keyof typeof counts] += 1
      }
    }

    return counts
  }, [listings])

  const conditionRatio = useMemo(() => {
    if (listings.length === 0) {
      return {
        brand_new: 0,
        like_new: 0,
        good: 0,
        fair: 0,
        poor: 0,
      }
    }

    return {
      brand_new: Math.round((conditionDistribution.brand_new / listings.length) * 100),
      like_new: Math.round((conditionDistribution.like_new / listings.length) * 100),
      good: Math.round((conditionDistribution.good / listings.length) * 100),
      fair: Math.round((conditionDistribution.fair / listings.length) * 100),
      poor: Math.round((conditionDistribution.poor / listings.length) * 100),
    }
  }, [conditionDistribution, listings.length])

  const priceBuckets = useMemo(() => {
    const prices = listings
      .map((listing) => Number.parseFloat(String(listing.price) || "0"))
      .filter((price) => Number.isFinite(price) && price > 0)

    const buckets = {
      under1m: 0,
      from1mTo5m: 0,
      from5mTo15m: 0,
      over15m: 0,
    }

    for (const price of prices) {
      if (price < 1_000_000) {
        buckets.under1m += 1
      } else if (price < 5_000_000) {
        buckets.from1mTo5m += 1
      } else if (price < 15_000_000) {
        buckets.from5mTo15m += 1
      } else {
        buckets.over15m += 1
      }
    }

    return buckets
  }, [listings])

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return "Tất cả sản phẩm"
    return categoryMap.get(selectedCategoryId)?.name ?? "Danh mục"
  }, [selectedCategoryId, categoryMap])

  const createMutation = useCreateListing()
  const uploadImageMutation = useUploadListingImage()

  const activeFilters = useMemo(() => {
    const chips: Array<{ label: string; clear: () => void }> = []

    if (selectedCategoryId) {
      chips.push({
        label: `Danh mục: ${selectedCategoryName}`,
        clear: () => setSelectedCategoryId(""),
      })
    }
    if (conditionGrade) {
      const map = {
        brand_new: "Mới 100%",
        like_new: "Như mới",
        good: "Còn tốt",
        fair: "Khá tốt",
        poor: "Đã cũ",
      } as const

      chips.push({
        label: `Tình trạng: ${map[conditionGrade] ?? conditionGrade}`,
        clear: () => setConditionGrade(""),
      })
    }
    if (province) {
      chips.push({
        label: `Tỉnh: ${province}`,
        clear: () => setProvince(""),
      })
    }
    if (district) {
      chips.push({
        label: `Huyện: ${district}`,
        clear: () => setDistrict(""),
      })
    }
    if (minPrice) {
      chips.push({
        label: `Giá từ: ${Number(minPrice).toLocaleString("vi-VN")} đ`,
        clear: () => setMinPrice(""),
      })
    }
    if (maxPrice) {
      chips.push({
        label: `Giá đến: ${Number(maxPrice).toLocaleString("vi-VN")} đ`,
        clear: () => setMaxPrice(""),
      })
    }

    return chips
  }, [
    selectedCategoryId,
    selectedCategoryName,
    setSelectedCategoryId,
    conditionGrade,
    setConditionGrade,
    province,
    setProvince,
    district,
    setDistrict,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
  ])

  const hasActiveFilters = activeFilters.length > 0 || keyword.trim().length > 0

  const emptyStateContent = useMemo(() => {
    if (keyword.trim()) {
      return {
        title: `Không có kết quả cho "${keyword.trim()}"`,
        description:
          "Thử từ khóa ngắn hơn hoặc bỏ dấu để mở rộng kết quả tìm kiếm.",
      }
    }

    if (selectedCategoryId && conditionGrade) {
      return {
        title: "Chưa có sản phẩm cho bộ lọc danh mục + tình trạng",
        description:
          "Hãy thử đổi tình trạng sản phẩm hoặc mở rộng khoảng giá để tìm thêm kết quả.",
      }
    }

    if (province || district) {
      return {
        title: "Khu vực này chưa có tin phù hợp",
        description:
          "Bạn có thể xóa bộ lọc khu vực để xem thêm sản phẩm toàn quốc.",
      }
    }

    if (minPrice || maxPrice) {
      return {
        title: "Không có sản phẩm trong khoảng giá hiện tại",
        description:
          "Thử mở rộng khoảng giá hoặc chọn sắp xếp khác để xem thêm lựa chọn.",
      }
    }

    return {
      title: "Chưa có sản phẩm ở thời điểm này",
      description: "Vui lòng quay lại sau hoặc thử danh mục khác.",
    }
  }, [
    keyword,
    selectedCategoryId,
    conditionGrade,
    province,
    district,
    minPrice,
    maxPrice,
  ])

  const handleCreateListing = async (payload: ListingFormSubmitPayload) => {
    try {
      const created = await createMutation.mutateAsync(payload.data)
      if (payload.files.length > 0) {
        for (let i = 0; i < payload.files.length; i++) {
          await uploadImageMutation.mutateAsync({
            listingId: created.id,
            file: payload.files[i],
            isPrimary: i === 0,
          })
        }
      }
      setIsListingModalOpen(false)
      toaster.create({ title: "Đăng tin thành công!", type: "success" })
    } catch (error: any) {
      toaster.create({
        title: error?.message || "Đăng tin thất bại",
        type: "error",
      })
    }
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <MarketplaceHeader
        keyword={keyword}
        onKeywordChange={setKeyword}
        onOpenCategoryMenu={() => setCategoryOverlayOpen(true)}
        onOpenListingModal={() => setIsListingModalOpen(true)}
        showMarquee={true}
      />

      <CategoryOverlay
        open={categoryOverlayOpen}
        categories={flatCategories}
        selectedCategoryId={selectedCategoryId}
        onClose={() => setCategoryOverlayOpen(false)}
        onSelectCategory={(id) => {
          setSelectedCategoryId(id)
          setCategoryOverlayOpen(false)
        }}
        onOpenListingModal={() => setIsListingModalOpen(true)}
      />

      <Container maxW="1440px" mx="auto" px="2%" pt="9rem" pb="5rem">
        {/* Hero Banner Carousel */}
        <HeroBannerCarousel />

        {/* Category Quick Access */}
        <CategoryQuickAccess
          categories={flatCategories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        <Flex gap="3%" align="flex-start">
          <Box w="22%" display={{ base: "none", lg: "block" }}>
            <Box
              bg="white"
              border="1px solid"
              borderColor="gray.200"
              borderRadius="1.25rem"
              p="1.25rem"
              boxShadow="sm"
            >
              <CategorySidebar
                categories={flatCategories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={setSelectedCategoryId}
              />
            </Box>
          </Box>

          <Box flex="1" minW={0}>
            <Flex mb="1.5rem" align="center" justify="space-between">
              <Heading
                as="h2"
                fontSize="1.5rem"
                fontWeight="800"
                color="gray.800"
              >
                {selectedCategoryName}
              </Heading>
              <Text
                fontSize="0.85rem"
                fontWeight="700"
                color="blue.600"
                bg="white"
                px="1rem"
                py="0.4rem"
                borderRadius="1rem"
                border="1px solid"
                borderColor="gray.200"
              >
                {!isLoading ? `${totalListings} kết quả` : "Đang tải..."}
              </Text>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 3 }} gap="0.75rem" mb="1rem">
              <Box
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="0.9rem"
                p="0.85rem"
              >
                <Text fontSize="0.7rem" color="gray.500" fontWeight="700">
                  Người bán đang hiển thị
                </Text>
                <Text fontSize="1.1rem" fontWeight="800" color="gray.800">
                  {uniqueSellerCount}
                </Text>
              </Box>
              <Box
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="0.9rem"
                p="0.85rem"
              >
                <Text fontSize="0.7rem" color="gray.500" fontWeight="700">
                  Giá trung bình trang này
                </Text>
                <Text fontSize="1.1rem" fontWeight="800" color="gray.800">
                  {averagePrice > 0
                    ? `${Math.round(averagePrice).toLocaleString("vi-VN")} đ`
                    : "0 đ"}
                </Text>
              </Box>
              <Box
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="0.9rem"
                p="0.85rem"
              >
                <Text fontSize="0.7rem" color="gray.500" fontWeight="700">
                  Tình trạng nổi bật
                </Text>
                <Text fontSize="1.1rem" fontWeight="800" color="gray.800">
                  {conditionDistribution.brand_new + conditionDistribution.like_new}
                </Text>
                <Text fontSize="0.72rem" color="gray.500">
                  Mới/Như mới trên trang hiện tại
                </Text>
              </Box>
            </SimpleGrid>

            <Box
              mb="2rem"
              bg="white"
              borderRadius="1.25rem"
              p="1.5rem"
              border="1px solid"
              borderColor="gray.200"
              boxShadow="sm"
            >
              <SimpleGrid columns={{ base: 1, md: 3 }} gap="1.25rem">
                <Box>
                  <Text
                    fontSize="0.7rem"
                    fontWeight="800"
                    color="gray.500"
                    mb="0.5rem"
                    textTransform="uppercase"
                  >
                    Tình trạng
                  </Text>
                  <select
                    value={conditionGrade}
                    onChange={(e) =>
                      setConditionGrade(e.target.value as typeof conditionGrade)
                    }
                    style={{
                      width: "100%",
                      height: "2rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #E2E8F0",
                      padding: "0 0.75rem",
                      fontSize: "0.85rem",
                      outline: "none",
                      background: "white",
                    }}
                  >
                    <option value="">Tất cả tình trạng</option>
                    <option value="brand_new">Mới 100%</option>
                    <option value="like_new">Như mới</option>
                    <option value="good">Còn tốt</option>
                    <option value="fair">Khá tốt</option>
                    <option value="poor">Đã cũ</option>
                  </select>
                </Box>
                <Box>
                  <Text
                    fontSize="0.7rem"
                    fontWeight="800"
                    color="gray.500"
                    mb="0.5rem"
                    textTransform="uppercase"
                  >
                    Khu vực
                  </Text>
                  <HStack gap="0.5rem">
                    <Input
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      placeholder="Tỉnh"
                      size="sm"
                      borderRadius="0.6rem"
                      border="1px solid"
                      borderColor="gray.200"
                    />
                    <Input
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Huyện"
                      size="sm"
                      borderRadius="0.6rem"
                      border="1px solid"
                      borderColor="gray.200"
                    />
                  </HStack>
                </Box>
                <Box>
                  <Text
                    fontSize="0.7rem"
                    fontWeight="800"
                    color="gray.500"
                    mb="0.5rem"
                    textTransform="uppercase"
                  >
                    Giá (VNĐ)
                  </Text>
                  <HStack gap="0.5rem">
                    <Input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="Từ"
                      size="sm"
                      borderRadius="0.6rem"
                      border="1px solid"
                      borderColor="gray.200"
                    />
                    <Input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="Đến"
                      size="sm"
                      borderRadius="0.6rem"
                      border="1px solid"
                      borderColor="gray.200"
                    />
                  </HStack>
                </Box>
                <Box>
                  <Text
                    fontSize="0.7rem"
                    fontWeight="800"
                    color="gray.500"
                    mb="0.5rem"
                    textTransform="uppercase"
                  >
                    Sắp xếp
                  </Text>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as ListingSortBy)}
                    style={{
                      width: "100%",
                      height: "2rem",
                      borderRadius: "0.6rem",
                      border: "1px solid #E2E8F0",
                      padding: "0 0.75rem",
                      fontSize: "0.85rem",
                      outline: "none",
                      background: "white",
                    }}
                  >
                    <option value="newest">Mới nhất</option>
                    <option value="price_asc">Giá tăng dần</option>
                    <option value="price_desc">Giá giảm dần</option>
                  </select>
                </Box>
              </SimpleGrid>

              {activeFilters.length > 0 ? (
                <Flex mt="1rem" gap="0.5rem" flexWrap="wrap" align="center">
                  {activeFilters.map((chip) => (
                    <Button
                      key={chip.label}
                      size="xs"
                      variant="outline"
                      borderRadius="full"
                      borderColor="gray.300"
                      bg="white"
                      onClick={chip.clear}
                    >
                      {chip.label} ×
                    </Button>
                  ))}
                  <Button
                    size="xs"
                    colorPalette="red"
                    variant="ghost"
                    onClick={() => {
                      setSelectedCategoryId("")
                      setConditionGrade("")
                      setProvince("")
                      setDistrict("")
                      setMinPrice("")
                      setMaxPrice("")
                      setSortBy("newest")
                    }}
                  >
                    Xóa tất cả bộ lọc
                  </Button>
                </Flex>
              ) : null}
            </Box>

            <SimpleGrid columns={{ base: 1, xl: 2 }} gap="0.9rem" mb="1.2rem">
              <Box
                bg="white"
                borderRadius="1rem"
                border="1px solid"
                borderColor="gray.200"
                p="1rem"
              >
                <Text fontSize="0.78rem" color="gray.500" fontWeight="700" mb="0.7rem">
                  Phân bố theo tình trạng
                </Text>
                {isLoading ? (
                  <SimpleGrid columns={1} gap="0.5rem">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Box
                        key={idx}
                        className="animate-shimmer"
                        h="10px"
                        borderRadius="full"
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <SimpleGrid columns={1} gap="0.45rem">
                    {[
                      { key: "brand_new", label: "Mới 100%", color: "#16A34A" },
                      { key: "like_new", label: "Như mới", color: "#2563EB" },
                      { key: "good", label: "Còn tốt", color: "#D97706" },
                      { key: "fair", label: "Khá tốt", color: "#EA580C" },
                      { key: "poor", label: "Đã cũ", color: "#6B7280" },
                    ].map((item) => (
                      <Flex key={item.key} align="center" gap="0.55rem">
                        <Text minW="88px" fontSize="0.72rem" color="gray.600">
                          {item.label}
                        </Text>
                        <Box flex={1} h="7px" bg="gray.100" borderRadius="full" overflow="hidden">
                          <Box
                            h="full"
                            borderRadius="full"
                            bg={item.color}
                            w={`${conditionRatio[item.key as keyof typeof conditionRatio]}%`}
                            transition="width 0.35s ease"
                          />
                        </Box>
                        <Text minW="38px" textAlign="right" fontSize="0.72rem" color="gray.600" fontWeight="700">
                          {conditionRatio[item.key as keyof typeof conditionRatio]}%
                        </Text>
                      </Flex>
                    ))}
                  </SimpleGrid>
                )}
              </Box>

              <Box
                bg="white"
                borderRadius="1rem"
                border="1px solid"
                borderColor="gray.200"
                p="1rem"
              >
                <Text fontSize="0.78rem" color="gray.500" fontWeight="700" mb="0.7rem">
                  Phân bố theo khoảng giá
                </Text>
                {isLoading ? (
                  <SimpleGrid columns={2} gap="0.55rem">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <Box
                        key={idx}
                        className="animate-shimmer"
                        h="52px"
                        borderRadius="0.7rem"
                      />
                    ))}
                  </SimpleGrid>
                ) : (
                  <HStack gap="0.55rem" flexWrap="wrap" align="stretch">
                    <Box border="1px solid" borderColor="gray.200" borderRadius="0.7rem" p="0.55rem" minW="118px">
                      <Text fontSize="0.68rem" color="gray.500">Dưới 1 triệu</Text>
                      <Text fontSize="0.95rem" fontWeight="800" color="gray.800">{priceBuckets.under1m}</Text>
                    </Box>
                    <Box border="1px solid" borderColor="gray.200" borderRadius="0.7rem" p="0.55rem" minW="118px">
                      <Text fontSize="0.68rem" color="gray.500">1-5 triệu</Text>
                      <Text fontSize="0.95rem" fontWeight="800" color="gray.800">{priceBuckets.from1mTo5m}</Text>
                    </Box>
                    <Box border="1px solid" borderColor="gray.200" borderRadius="0.7rem" p="0.55rem" minW="118px">
                      <Text fontSize="0.68rem" color="gray.500">5-15 triệu</Text>
                      <Text fontSize="0.95rem" fontWeight="800" color="gray.800">{priceBuckets.from5mTo15m}</Text>
                    </Box>
                    <Box border="1px solid" borderColor="gray.200" borderRadius="0.7rem" p="0.55rem" minW="118px">
                      <Text fontSize="0.68rem" color="gray.500">Trên 15 triệu</Text>
                      <Text fontSize="0.95rem" fontWeight="800" color="gray.800">{priceBuckets.over15m}</Text>
                    </Box>
                  </HStack>
                )}
              </Box>
            </SimpleGrid>

            <ListingGrid
              listings={listings}
              categoryMap={categoryMap}
              sellerMap={sellerMap}
              isLoading={isLoading}
              skeletonRows={2}
              emptyStateTitle={emptyStateContent.title}
              emptyStateDescription={emptyStateContent.description}
            />

            {!isLoading && hasActiveFilters && listings.length === 0 ? (
              <Flex mt="0.9rem" justify="center">
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="full"
                  onClick={() => {
                    setSelectedCategoryId("")
                    setConditionGrade("")
                    setProvince("")
                    setDistrict("")
                    setMinPrice("")
                    setMaxPrice("")
                    setKeyword("")
                    setSortBy("newest")
                  }}
                >
                  Xóa tất cả để xem lại toàn bộ sản phẩm
                </Button>
              </Flex>
            ) : null}

            {!isLoading && totalPages > 1 ? (
              <Flex mt="4rem" justify="center">
                <PaginationRoot
                  count={totalListings}
                  pageSize={pageSize}
                  page={page}
                  onPageChange={(e) => setPage(e.page)}
                >
                  <HStack gap="0.5rem">
                    <PaginationPrevTrigger />
                    <PaginationItems />
                    <PaginationNextTrigger />
                  </HStack>
                </PaginationRoot>
              </Flex>
            ) : null}
          </Box>
        </Flex>
      </Container>

      <ListingModal
        isOpen={isListingModalOpen}
        onOpenChange={setIsListingModalOpen}
        onSubmit={handleCreateListing}
        isLoading={createMutation.isPending || uploadImageMutation.isPending}
      />
    </Box>
  )
}
