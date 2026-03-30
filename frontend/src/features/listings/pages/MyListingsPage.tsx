import { useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  Input,
  NativeSelect,
  Dialog,
  Portal,
  Spinner,
  VStack,
  HStack,
} from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { FiPlus, FiSearch, FiArrowLeft } from "react-icons/fi";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import {
  useMyListings,
  useCreateListing,
  useUpdateListing,
  useDeleteListing,
  useUploadListingImage,
} from "@/features/listings/hooks/useMyListings";
import { ListingModal } from "@/features/listings/components/ListingModal";
import { ListingsTable } from "@/features/listings/components/ListingsTable";
import type { ListingRead } from "@/client";
import type { ListingFormSubmitPayload } from "@/features/listings/components/ListingForm";

export function MyListingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthUser();

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" });
    return null;
  }

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<ListingRead | null>(
    null,
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Queries and mutations
  const { data: listingsData, isLoading: isLoadingListings } = useMyListings({
    keyword: searchKeyword,
    status: selectedStatus,
    skip: 0,
    limit: 50,
  });

  const createMutation = useCreateListing();
  const updateMutation = useUpdateListing();
  const deleteMutation = useDeleteListing();
  const uploadImageMutation = useUploadListingImage();

  const handleCreateClick = () => {
    setEditingListing(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (listing: ListingRead) => {
    setEditingListing(listing);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (listing: ListingRead) => {
    setDeleteConfirmId(listing.id);
  };

  const handleViewClick = (listing: ListingRead) => {
    navigate({ to: `/listing/${listing.id}` });
  };

  const handleFormSubmit = async ({ data, files }: ListingFormSubmitPayload) => {
    let targetListingId = editingListing?.id;

    if (editingListing) {
      await updateMutation.mutateAsync({
        listingId: editingListing.id,
        data,
      });
    } else {
      const created = await createMutation.mutateAsync(data);
      targetListingId = created.id;
    }

    if (targetListingId) {
      for (const [index, file] of files.entries()) {
        await uploadImageMutation.mutateAsync({
          listingId: targetListingId,
          file,
          isPrimary: index === 0,
        });
      }
    }

    setIsFormOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteMutation.mutateAsync(deleteConfirmId);
        setDeleteConfirmId(null);
      } catch (error) {
        console.error("Error deleting listing:", error);
      }
    }
  };

  if (authLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="7xl" mx="auto" px={{ base: 4, sm: 6, lg: 8 }} py={12}>
        {/* Top Actions */}
        <Flex align="center" justify="space-between" mb={6}>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/" })}
            color="blue.600"
            _hover={{ bg: "blue.50" }}
            px={4}
          >
            <FiArrowLeft style={{ marginRight: "0.5rem" }} />
            Quay lại trang chủ
          </Button>
        </Flex>
        {/* Header with Create Button */}
        <Flex
          align="center"
          justify="space-between"
          mb={8}
          direction={{ base: "column", sm: "row" }}
          gap={4}
        >
          <Box>
            <Heading as="h2" size="lg" color="gray.900">
              Danh sách tin đăng
            </Heading>
            <Text mt={1} color="gray.600" fontSize="sm">
              Tổng: {listingsData?.items.length || 0} tin đăng
            </Text>
          </Box>
          <Button
            onClick={handleCreateClick}
            bg="blue.600"
            color="white"
            _hover={{ bg: "blue.700" }}
            borderRadius="md"
            fontWeight="medium"
            size="lg"
            px={10}
            w={{ base: "full", sm: "auto" }}
          >
            <FiPlus style={{ marginRight: "0.5rem" }} />
            Đăng tin mới
          </Button>
        </Flex>

        {/* Search and Filter */}
        <Box bg="white" borderRadius="lg" boxShadow="sm" p={4} mb={6}>
          <VStack gap={4} align="stretch">
            <Flex direction={{ base: "column", sm: "row" }} gap={4}>
              <Box flex={1} position="relative">
                <Box
                  position="absolute"
                  left={3}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={1}
                >
                  <FiSearch color="gray" />
                </Box>
                <Input
                  placeholder="Tìm kiếm tin đăng..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  pl={10}
                />
              </Box>
              <NativeSelect.Root w={{ base: "full", sm: "auto" }}>
                <NativeSelect.Field
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="pending">Chờ xem xét</option>
                  <option value="active">Đang bán</option>
                  <option value="sold">Đã bán</option>
                  <option value="hidden">Ẩn</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Flex>
          </VStack>
        </Box>

        {/* Listings Table */}
        <Box bg="white" borderRadius="lg" boxShadow="sm" overflow="hidden">
          <ListingsTable
            listings={listingsData?.items || []}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
            onView={handleViewClick}
            isLoading={isLoadingListings}
          />
        </Box>
      </Container>

      {/* Listing Modal */}
      <ListingModal
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingListing={editingListing}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending || uploadImageMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={!!deleteConfirmId}
        onOpenChange={(e) => !e.open && setDeleteConfirmId(null)}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content maxW="sm" bg="white" borderRadius="lg">
              <Dialog.Body p={6}>
                <Heading as="h2" size="md" mb={2}>
                  Xác nhận xóa
                </Heading>
                <Text color="gray.700" mb={6}>
                  Bạn chắc chắn muốn xóa tin đăng này? Hành động này không thể
                  hoàn tác.
                </Text>
                <HStack gap={3} justify="flex-end">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    Hủy
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={handleConfirmDelete}
                    loading={deleteMutation.isPending}
                  >
                    Xóa
                  </Button>
                </HStack>
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
}
