import {
  Box,
  Container,
  Dialog,
  Flex,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Portal,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FiArrowLeft, FiPlus, FiSearch } from "react-icons/fi";
import type { ListingRead } from "@/client";
import { ApiError } from "@/client";
import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input-group";
import { toaster } from "@/components/ui/toaster";
import { useAuthUser } from "@/features/auth/hooks/useAuthUser";
import type { ListingFormSubmitPayload } from "@/features/listings/components/ListingForm";
import { ListingModal } from "@/features/listings/components/ListingModal";
import { ListingsTable } from "@/features/listings/components/ListingsTable";
import {
  useCreateListingWithImagesAtomic,
  useDeleteListing,
  useMyListings,
  useUpdateListing,
  useUploadListingImage,
} from "@/features/listings/hooks/useMyListings";

export function MyListingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuthUser();

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

  const createWithImagesAtomicMutation = useCreateListingWithImagesAtomic();
  const updateMutation = useUpdateListing();
  const deleteMutation = useDeleteListing();
  const uploadImageMutation = useUploadListingImage();

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" });
    return null;
  }

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
    navigate({ to: `/listings/${listing.id}` });
  };

  const handleFormSubmit = async ({
    data,
    files,
  }: ListingFormSubmitPayload) => {
    try {
      if (editingListing) {
        await updateMutation.mutateAsync({
          listingId: editingListing.id,
          data,
        });

        // For edit mode, keep existing incremental image upload behavior.
        for (const [index, file] of files.entries()) {
          await uploadImageMutation.mutateAsync({
            listingId: editingListing.id,
            file,
            isPrimary: index === 0,
          });
        }
      } else {
        // Atomic create: backend guarantees rollback if any image upload fails.
        await createWithImagesAtomicMutation.mutateAsync({ data, files });
      }

      toaster.create({
        type: "success",
        title: editingListing
          ? "Cập nhật tin đăng thành công"
          : "Tạo tin đăng thành công",
      });
      setIsFormOpen(false);
    } catch (error) {
      let message = "Tạo tin đăng thất bại. Vui lòng thử lại.";
      if (error instanceof ApiError) {
        if (error.status === 409) {
          message = "Ảnh bị trùng với tin khác. Vui lòng chọn ảnh khác.";
        } else if (error.status === 429) {
          message = "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây.";
        } else if (error.status >= 500) {
          message = "Lỗi máy chủ khi tạo tin/ảnh. Tin chưa được tạo.";
        }
      }

      toaster.create({ type: "error", title: message });
      return;
    }
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
      <Container
        maxW="1440px"
        mx="auto"
        px={{ base: "1rem", md: "2%" }}
        py={10}
      >
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/" })}
          color="blue.600"
          _hover={{ bg: "blue.50" }}
          px={4}
          mb={6}
          borderRadius="xl"
        >
          <FiArrowLeft style={{ marginRight: "0.5rem" }} />
          Quay lại trang chủ
        </Button>

        {/* Header Card */}
        <Box
          bg="whiteAlpha.800"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          p={8}
          boxShadow="0 10px 40px rgba(0,0,0,0.06)"
          border="1px"
          borderColor="whiteAlpha.400"
          mb={6}
        >
          <Flex
            align="center"
            justify="space-between"
            direction={{ base: "column", sm: "row" }}
            gap={4}
          >
            <Box>
              <Heading as="h2" size="xl" color="gray.900">
                Danh sách tin đăng
              </Heading>
              <Text mt={1} color="gray.500" fontSize="sm">
                Tổng: {listingsData?.items.length || 0} tin đăng
              </Text>
            </Box>
            <Button
              onClick={handleCreateClick}
              size="lg"
              px={8}
              w={{ base: "full", sm: "auto" }}
              borderRadius="xl"
              boxShadow="0 4px 15px rgba(66,153,225,0.35)"
              style={{
                background: "linear-gradient(135deg, #3B82F6, #7C3AED)",
              }}
              color="white"
              _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
              transition="all 0.2s"
            >
              <FiPlus style={{ marginRight: "0.5rem" }} />
              Đăng tin mới
            </Button>
          </Flex>
        </Box>

        {/* Search and Filter Card */}
        <Box
          bg="whiteAlpha.800"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          p={5}
          boxShadow="0 4px 20px rgba(0,0,0,0.04)"
          border="1px"
          borderColor="whiteAlpha.400"
          mb={6}
        >
          <Flex direction={{ base: "column", sm: "row" }} gap={4}>
            <Box flex={1}>
              <InputGroup
                width="full"
                startElement={
                  <Box
                    color="gray.400"
                    display="flex"
                    alignItems="center"
                    ps={3}
                  >
                    <FiSearch size={16} />
                  </Box>
                }
              >
                <Input
                  placeholder="Tìm kiếm tin đăng..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  borderRadius="xl"
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  ps="10"
                  _focus={{
                    borderColor: "blue.400",
                    ring: "1px",
                    ringColor: "blue.400",
                  }}
                />
              </InputGroup>
            </Box>
            <NativeSelect.Root w={{ base: "full", sm: "200px" }}>
              <NativeSelect.Field
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                borderRadius="xl"
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                _focus={{
                  borderColor: "blue.400",
                  ring: "1px",
                  ringColor: "blue.400",
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xem xét</option>
                <option value="active">Đang bán</option>
                <option value="sold">Đã bán</option>
                <option value="hidden">Ẩn</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Flex>
        </Box>

        {/* Listings Table Card */}
        <Box
          bg="whiteAlpha.800"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          boxShadow="0 10px 40px rgba(0,0,0,0.06)"
          border="1px"
          borderColor="whiteAlpha.400"
          overflow="hidden"
        >
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
        isLoading={
          createWithImagesAtomicMutation.isPending ||
          updateMutation.isPending ||
          uploadImageMutation.isPending
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={!!deleteConfirmId}
        onOpenChange={(e) => !e.open && setDeleteConfirmId(null)}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content
              maxW="sm"
              bg="white"
              borderRadius="2xl"
              boxShadow="0 20px 60px rgba(0,0,0,0.12)"
            >
              <Dialog.Body p={7}>
                <Heading as="h2" size="md" mb={3} color="gray.900">
                  Xác nhận xóa
                </Heading>
                <Text color="gray.600" mb={6} fontSize="sm">
                  Bạn chắc chắn muốn xóa tin đăng này? Hành động này không thể
                  hoàn tác.
                </Text>
                <HStack gap={3} justify="flex-end">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmId(null)}
                    borderRadius="xl"
                  >
                    Hủy
                  </Button>
                  <Button
                    colorPalette="red"
                    onClick={handleConfirmDelete}
                    loading={deleteMutation.isPending}
                    loadingText="Đang xóa..."
                    borderRadius="xl"
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
