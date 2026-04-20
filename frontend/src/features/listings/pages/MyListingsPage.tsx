import {
  Box,
  Container,
  Dialog,
  Flex,
  Heading,
  HStack,
  Input,
  Portal,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiList,
  FiPlus,
  FiSearch,
  FiShoppingBag,
} from "react-icons/fi"
import type { ListingRead } from "@/client"
import { ApiError } from "@/client"
import { Button } from "@/components/ui/button"
import { InputGroup } from "@/components/ui/input-group"
import { toaster } from "@/components/ui/toaster"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import type { ListingFormSubmitPayload } from "@/features/listings/components/ListingForm"
import { ListingModal } from "@/features/listings/components/ListingModal"
import { ListingsTable } from "@/features/listings/components/ListingsTable"
import {
  useCreateListingWithImagesAtomic,
  useDeleteListing,
  useMyListings,
  useUpdateListing,
  useUploadListingImage,
} from "@/features/listings/hooks/useMyListings"

const STATUS_TABS = [
  { value: "active", label: "Đang bán" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "sold", label: "Đã bán" },
  { value: "hidden", label: "Đã ẩn" },
]

export function MyListingsPage() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading: authLoading } = useAuthUser()

  const [searchKeyword, setSearchKeyword] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("pending")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<ListingRead | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Queries and mutations — always fetch all to compute stats
  const { data: listingsData, isLoading: isLoadingListings } = useMyListings({
    keyword: searchKeyword,
    status: selectedStatus,
    skip: 0,
    limit: 50,
  })
  const { data: allListingsData } = useMyListings({ skip: 0, limit: 200 })

  // Compute stat counts from all listings
  const stats = useMemo(() => {
    const all = allListingsData?.items ?? []
    return {
      total: all.length,
      active: all.filter((l) => l.status === "active").length,
      pending: all.filter((l) => l.status === "pending").length,
      sold: all.filter((l) => l.status === "sold").length,
    }
  }, [allListingsData])

  const createWithImagesAtomicMutation = useCreateListingWithImagesAtomic()
  const updateMutation = useUpdateListing()
  const deleteMutation = useDeleteListing()
  const uploadImageMutation = useUploadListingImage()

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" })
    return null
  }

  const handleCreateClick = () => {
    setEditingListing(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (listing: ListingRead) => {
    setEditingListing(listing)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (listing: ListingRead) => {
    setDeleteConfirmId(listing.id)
  }

  const handleViewClick = (listing: ListingRead) => {
    navigate({ to: `/listings/${listing.id}` })
  }

  const handleFormSubmit = async ({
    data,
    files,
  }: ListingFormSubmitPayload) => {
    try {
      if (editingListing) {
        await updateMutation.mutateAsync({
          listingId: editingListing.id,
          data,
        })

        // For edit mode, keep existing incremental image upload behavior.
        for (const [index, file] of files.entries()) {
          await uploadImageMutation.mutateAsync({
            listingId: editingListing.id,
            file,
            isPrimary: index === 0,
          })
        }
      } else {
        // Atomic create: backend guarantees rollback if any image upload fails.
        await createWithImagesAtomicMutation.mutateAsync({ data, files })
      }

      toaster.create({
        type: "success",
        title: editingListing
          ? "Cập nhật tin đăng thành công"
          : "Tạo tin đăng thành công",
      })
      setIsFormOpen(false)
    } catch (error) {
      let message = "Tạo tin đăng thất bại. Vui lòng thử lại."
      if (error instanceof ApiError) {
        if (error.status === 409) {
          message = "Ảnh bị trùng với tin khác. Vui lòng chọn ảnh khác."
        } else if (error.status === 429) {
          message = "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít giây."
        } else if (error.status >= 500) {
          message = "Lỗi máy chủ khi tạo tin/ảnh. Tin chưa được tạo."
        }
      }

      toaster.create({ type: "error", title: message })
      return
    }
  }

  const handleConfirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await deleteMutation.mutateAsync(deleteConfirmId)
        setDeleteConfirmId(null)
      } catch (error) {
        console.error("Error deleting listing:", error)
      }
    }
  }

  if (authLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
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

        {/* Header */}
        <Flex align="center" justify="space-between" mb={6} wrap="wrap" gap={4}>
          <Box>
            <Heading
              as="h1"
              fontSize="2xl"
              fontWeight="800"
              color="gray.900"
              display="flex"
              alignItems="center"
            >
              <FiList
                size={28}
                style={{ display: "inline", marginRight: "10px" }}
              />
              Tin đăng của tôi
            </Heading>
            <Text mt={1} color="gray.500" fontSize="sm">
              Quản lý tất cả tin đăng mua bán của bạn
            </Text>
          </Box>
          <Button
            onClick={handleCreateClick}
            size="lg"
            px={8}
            borderRadius="xl"
            className="btn-shine"
            boxShadow="0 4px 15px rgba(37,99,235,0.35)"
            style={{
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              color: "white",
              position: "relative",
              overflow: "hidden",
            }}
            _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
            transition="all 0.2s"
          >
            <FiPlus style={{ marginRight: "0.5rem" }} />
            Đăng tin mới
          </Button>
        </Flex>

        {/* Stat Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
          <div className="stat-card animate-fadeinup delay-0">
            <div className="stat-card-icon" style={{ background: "#EFF6FF" }}>
              <FiList size={18} color="#2563eb" />
            </div>
            <div className="stat-card-value">{stats.total}</div>
            <div className="stat-card-label">Tổng tin đăng</div>
          </div>
          <div className="stat-card animate-fadeinup delay-1">
            <div className="stat-card-icon" style={{ background: "#F0FDF4" }}>
              <FiCheckCircle size={18} color="#10b981" />
            </div>
            <div className="stat-card-value" style={{ color: "#10b981" }}>
              {stats.active}
            </div>
            <div className="stat-card-label">Đang bán</div>
          </div>
          <div className="stat-card animate-fadeinup delay-2">
            <div className="stat-card-icon" style={{ background: "#FFFBEB" }}>
              <FiClock size={18} color="#f59e0b" />
            </div>
            <div className="stat-card-value" style={{ color: "#f59e0b" }}>
              {stats.pending}
            </div>
            <div className="stat-card-label">Chờ duyệt</div>
          </div>
          <div className="stat-card animate-fadeinup delay-3">
            <div className="stat-card-icon" style={{ background: "#F5F3FF" }}>
              <FiShoppingBag size={18} color="#7c3aed" />
            </div>
            <div className="stat-card-value" style={{ color: "#7c3aed" }}>
              {stats.sold}
            </div>
            <div className="stat-card-label">Đã bán</div>
          </div>
        </SimpleGrid>

        {/* Search and Status Filter */}
        <Box
          bg="white"
          borderRadius="2xl"
          p={5}
          boxShadow="0 4px 20px rgba(0,0,0,0.04)"
          border="1px solid"
          borderColor="gray.100"
          mb={6}
        >
          <Box mb={4}>
            <InputGroup
              width="full"
              startElement={
                <Box color="gray.400" display="flex" alignItems="center" ps={3}>
                  <FiSearch size={16} />
                </Box>
              }
            >
              <Input
                placeholder="Tìm kiếm tin đăng..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                borderRadius="xl"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                ps="10"
                _focus={{ borderColor: "blue.400", bg: "white" }}
              />
            </InputGroup>
          </Box>
          {/* Status filter tabs */}
          <HStack gap={2} flexWrap="wrap">
            {STATUS_TABS.map((tab) => (
              <Box
                key={tab.value}
                as="button"
                onClick={() => setSelectedStatus(tab.value)}
                px={4}
                py={1.5}
                borderRadius="full"
                fontSize="sm"
                fontWeight="600"
                border="1px solid"
                cursor="pointer"
                transition="all 0.2s"
                bg={selectedStatus === tab.value ? "blue.600" : "white"}
                color={selectedStatus === tab.value ? "white" : "gray.600"}
                borderColor={
                  selectedStatus === tab.value ? "blue.600" : "gray.200"
                }
                _hover={{
                  borderColor: "blue.400",
                  color: selectedStatus === tab.value ? "white" : "blue.600",
                }}
              >
                {tab.label}
              </Box>
            ))}
          </HStack>
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
  )
}
