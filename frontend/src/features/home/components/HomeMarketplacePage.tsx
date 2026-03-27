import { useMemo, useState } from "react";
import { Box, Container, Heading, Text, Flex } from "@chakra-ui/react";
import { CategoryOverlay } from "@/features/home/components/CategoryOverlay";
import { CategorySidebar } from "@/features/home/components/CategorySidebar";
import { ListingGrid } from "@/features/home/components/ListingGrid";
import { MarketplaceHeader } from "@/features/home/components/MarketplaceHeader";
import { ListingModal } from "@/features/listings/components/ListingModal";
import { useCreateListing } from "@/features/listings/hooks/useMyListings";
import { useMarketplaceData } from "@/features/home/hooks/useMarketplaceData";

export function HomeMarketplacePage() {
  const [categoryOverlayOpen, setCategoryOverlayOpen] = useState(false);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const {
    selectedCategoryId,
    setSelectedCategoryId,
    keyword,
    setKeyword,
    categoriesQuery,
    listingsQuery,
    categoryMap,
    sellerMap,
    flatCategories,
  } = useMarketplaceData();

  const createMutation = useCreateListing();

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) {
      return "Tất cả sản phẩm";
    }

    return categoryMap.get(selectedCategoryId)?.name ?? "Danh mục";
  }, [selectedCategoryId, categoryMap]);

  const handleCreateListing = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      setIsListingModalOpen(false);
    } catch (error) {
      console.error("Error creating listing:", error);
    }
  };

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
          setSelectedCategoryId(id);
          setCategoryOverlayOpen(false);
        }}
      />

      <Container maxW="1400px" mx="auto" px={{ base: 4, md: 6 }} py={6}>
        <Box
          mb={6}
          borderRadius="2xl"
          bg="blue.600"
          p={8}
          color="white"
          boxShadow="lg"
          position="relative"
          overflow="hidden"
        >
          <Text
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wider"
            color="blue.100"
            fontWeight="medium"
          >
            Marketplace
          </Text>
          <Heading
            as="h1"
            mt={1}
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="bold"
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
              <ListingGrid
                listings={listingsQuery.data?.items ?? []}
                categoryMap={categoryMap}
                sellerMap={sellerMap}
              />
            ) : null}
          </Box>
        </Flex>
      </Container>

      {/* Listing Modal */}
      <ListingModal
        isOpen={isListingModalOpen}
        onOpenChange={setIsListingModalOpen}
        onSubmit={handleCreateListing}
        isLoading={createMutation.isPending}
      />
    </Box>
  );
}
