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

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return "Tất cả sản phẩm"
    return categoryMap.get(selectedCategoryId)?.name ?? "Danh mục"
  }, [selectedCategoryId, categoryMap])

  const createMutation = useCreateListing()
  const uploadImageMutation = useUploadListingImage()

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
            </Box>

            {isLoading ? (
              <Flex
                w="100%"
                h="25rem"
                align="center"
                justify="center"
                bg="white"
                borderRadius="1.25rem"
                border="1px dashed"
                borderColor="gray.300"
              >
                <Box
                  w="2.5rem"
                  h="2.5rem"
                  border="3px solid"
                  borderColor="blue.500"
                  borderBottomColor="transparent"
                  borderRadius="50%"
                  animation="spin 1s linear infinite"
                />
              </Flex>
            ) : (
              <>
                <ListingGrid
                  listings={listings}
                  categoryMap={categoryMap}
                  sellerMap={sellerMap}
                />

                {totalPages > 1 && (
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
                )}
              </>
            )}
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
