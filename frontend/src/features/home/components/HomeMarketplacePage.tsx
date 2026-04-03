import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Text,
} from "@chakra-ui/react"
import { useMemo, useState } from "react"
import type { ConditionGrade } from "@/client"
import { toaster } from "@/components/ui/toaster"
import { CategoryOverlay } from "@/features/home/components/CategoryOverlay"
import { CategorySidebar } from "@/features/home/components/CategorySidebar"
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

  const total = listingsQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const createMutation = useCreateListing()
  const uploadImageMutation = useUploadListingImage()

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) {
      return "Tất cả sản phẩm"
    }

    return categoryMap.get(selectedCategoryId)?.name ?? "Danh mục"
  }, [selectedCategoryId, categoryMap])

  const handleCreateListing = async ({
    data,
    files,
  }: ListingFormSubmitPayload) => {
    try {
      const created = await createMutation.mutateAsync(data)

      for (const [index, file] of files.entries()) {
        await uploadImageMutation.mutateAsync({
          listingId: created.id,
          file,
          isPrimary: index === 0,
        })
      }

      setIsListingModalOpen(false)
      toaster.create({
        title: "Đăng tin thành công! Sản phẩm đang chờ duyệt.",
        type: "success",
      })
    } catch (error: any) {
      toaster.create({
        title: error?.message || "Không thể đăng tin. Vui lòng thử lại sau.",
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
      />

      <Container maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
        <Box
          mb={6}
          borderRadius="2xl"
          p={8}
          color="white"
          boxShadow="0 10px 30px rgba(2,69,122,0.3)"
          position="relative"
          overflow="hidden"
          style={{
            background: "linear-gradient(135deg, #02457A 0%, #018ABE 100%)",
          }}
        >
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
            color="whiteAlpha.800"
            fontWeight="medium"
          >
            Marketplace
          </Text>
          <Heading
            as="h1"
            mt={1}
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
            color="white"
          >
            Khám phá sản phẩm
          </Heading>
          <Text
            mt={2}
            fontSize={{ base: "sm", md: "md" }}
            color="whiteAlpha.900"
            fontWeight="medium"
          >
            Hàng nghìn sản phẩm từ những người bán uy tín đang chờ đón bạn.
          </Text>
        </Box>

        <Flex mb={4} align="center" justify="space-between" gap={3}>
          <Heading as="h2" fontSize="lg" fontWeight="semibold" color="gray.900">
            {selectedCategoryName}
          </Heading>
          <Text fontSize="sm" fontWeight="medium" color="gray.500">
            {listingsQuery.data
              ? `${listingsQuery.data.total} kết quả`
              : "Đang tải..."}
          </Text>
        </Flex>

        <Box
          mb={6}
          bg="white"
          border="1px"
          borderColor="gray.200"
          borderRadius="2xl"
          p={{ base: 4, md: 5 }}
          boxShadow="sm"
        >
          <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
            Tim kiem nang cao
          </Text>

          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap={3}>
            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                Tinh/Thanh pho
              </Text>
              <Input
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Vi du: Ha Noi"
                size="sm"
              />
            </Box>

            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                Quan/Huyen
              </Text>
              <Input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Vi du: Cau Giay"
                size="sm"
              />
            </Box>

            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                Tinh trang
              </Text>
              <select
                value={conditionGrade}
                onChange={(e) =>
                  setConditionGrade(e.target.value as ConditionGrade | "")
                }
                style={{
                  width: "100%",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  padding: "0 8px",
                  background: "white",
                }}
              >
                <option value="">Tat ca</option>
                <option value="brand_new">Moi 100%</option>
                <option value="like_new">Nhu moi</option>
                <option value="good">Tot</option>
                <option value="fair">Kha</option>
                <option value="poor">Trung binh</option>
              </select>
            </Box>

            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                Gia tu
              </Text>
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                size="sm"
                min={0}
              />
            </Box>

            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                Gia den
              </Text>
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="10000000"
                size="sm"
                min={0}
              />
            </Box>

            <Box>
              <Text fontSize="xs" color="gray.500" mb={1}>
                Sap xep
              </Text>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as ListingSortBy)}
                style={{
                  width: "100%",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  padding: "0 8px",
                  background: "white",
                }}
              >
                <option value="newest">Moi nhat</option>
                <option value="price_asc">Gia thap den cao</option>
                <option value="price_desc">Gia cao den thap</option>
              </select>
            </Box>
          </SimpleGrid>

          <Flex justify="flex-end" mt={3}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setConditionGrade("")
                setProvince("")
                setDistrict("")
                setMinPrice("")
                setMaxPrice("")
                setSortBy("newest")
              }}
            >
              Xoa bo loc
            </Button>
          </Flex>
        </Box>

        <Flex direction={{ base: "column", lg: "row" }} gap={6}>
          <CategorySidebar
            categories={flatCategories}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
          />

          <Box as="main" flex={1} minW={0}>
            {categoriesQuery.isLoading || listingsQuery.isLoading ? (
              <Box
                borderRadius="2xl"
                border="1px"
                borderColor="gray.200"
                bg="white"
                p={8}
                fontSize="sm"
                color="gray.500"
              >
                Đang tải dữ liệu...
              </Box>
            ) : null}

            {categoriesQuery.isError || listingsQuery.isError ? (
              <Box
                borderRadius="2xl"
                border="1px"
                borderColor="red.200"
                bg="red.50"
                p={8}
                fontSize="sm"
                color="red.700"
              >
                Không thể tải dữ liệu. Vui lòng kiểm tra cấu hình VITE_API_URL
                và trạng thái server.
              </Box>
            ) : null}

            {!categoriesQuery.isLoading &&
            !listingsQuery.isLoading &&
            !categoriesQuery.isError &&
            !listingsQuery.isError ? (
              <>
                <ListingGrid
                  listings={listingsQuery.data?.items ?? []}
                  categoryMap={categoryMap}
                  sellerMap={sellerMap}
                />

                {total > 0 && (
                  <Flex mt={6} align="center" justify="center" gap={3}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((current) => Math.max(1, current - 1))}
                      disabled={page <= 1}
                    >
                      Trang trước
                    </Button>
                    <Text fontSize="sm" color="gray.600" minW="92px" textAlign="center">
                      Trang {page}/{totalPages}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                      disabled={page >= totalPages}
                    >
                      Trang sau
                    </Button>
                  </Flex>
                )}
              </>
            ) : null}
          </Box>
        </Flex>
      </Container>

      {/* Listing Modal */}
      <ListingModal
        isOpen={isListingModalOpen}
        onOpenChange={setIsListingModalOpen}
        onSubmit={handleCreateListing}
        isLoading={createMutation.isPending || uploadImageMutation.isPending}
      />
    </Box>
  )
}
