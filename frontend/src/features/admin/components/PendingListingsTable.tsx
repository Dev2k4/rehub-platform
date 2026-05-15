import {
  Badge,
  Box,
  Flex,
  IconButton,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiCheck, FiX } from "react-icons/fi"
import type { ListingRead } from "@/client"
import { useApproveListing, useRejectListing } from "../hooks/useAdminListings"
import { ConfirmDialog } from "./ConfirmDialog"
import { RejectListingDialog } from "./RejectListingDialog"

interface PendingListingsTableProps {
  listings: ListingRead[]
  isLoading: boolean
}

export function PendingListingsTable({
  listings,
  isLoading,
}: PendingListingsTableProps) {
  const [selectedListing, setSelectedListing] = useState<ListingRead | null>(
    null,
  )
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)

  const approveMutation = useApproveListing()
  const rejectMutation = useRejectListing()

  const handleApproveClick = (listing: ListingRead) => {
    setSelectedListing(listing)
    setIsApproveOpen(true)
  }

  const handleRejectClick = (listing: ListingRead) => {
    setSelectedListing(listing)
    setIsRejectOpen(true)
  }

  const handleApproveConfirm = () => {
    if (!selectedListing) return
    approveMutation.mutate(selectedListing.id, {
      onSuccess: () => {
        setSelectedListing(null)
        setIsApproveOpen(false)
      },
    })
  }

  const handleRejectConfirm = (reason: string) => {
    if (!selectedListing) return
    rejectMutation.mutate(
      { listingId: selectedListing.id, reason: reason || undefined },
      {
        onSuccess: () => {
          setSelectedListing(null)
          setIsRejectOpen(false)
        },
      },
    )
  }

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseInt(price, 10))
  }

  if (isLoading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  if (listings.length === 0) {
    return (
      <Flex justify="center" py={12}>
        <Text color="gray.500">Không có tin đăng chờ duyệt</Text>
      </Flex>
    )
  }

  return (
    <>
      <Box overflowX="auto">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="gray.50">
              <Table.ColumnHeader
                px={5}
                py={3}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
                color="gray.500"
                letterSpacing="wide"
              >
                Tiêu đề
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={5}
                py={3}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
                color="gray.500"
                letterSpacing="wide"
              >
                Giá
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={5}
                py={3}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
                color="gray.500"
                letterSpacing="wide"
              >
                Tình trạng
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={5}
                py={3}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
                color="gray.500"
                letterSpacing="wide"
              >
                Ngày đăng
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={5}
                py={3}
                fontSize="xs"
                fontWeight="700"
                textTransform="uppercase"
                color="gray.500"
                letterSpacing="wide"
              >
                Thao tác
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {listings.map((listing) => (
              <Table.Row
                key={listing.id}
                _hover={{ bg: "gray.50" }}
                transition="all 0.2s"
              >
                <Table.Cell
                  px={6}
                  py={4}
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.900"
                  maxW="300px"
                >
                  <Text lineClamp={2}>{listing.title}</Text>
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.600">
                  {formatPrice(listing.price)}
                </Table.Cell>
                <Table.Cell px={6} py={4}>
                  <Badge
                    colorPalette={
                      listing.condition_grade === "brand_new"
                        ? "green"
                        : listing.condition_grade === "like_new"
                          ? "blue"
                          : "gray"
                    }
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {listing.condition_grade === "brand_new"
                      ? "Mới"
                      : listing.condition_grade === "like_new"
                        ? "Như mới"
                        : listing.condition_grade === "good"
                          ? "Tốt"
                          : listing.condition_grade === "fair"
                            ? "Khá"
                            : "Cũ"}
                  </Badge>
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.600">
                  {new Date(listing.created_at).toLocaleDateString("vi-VN")}
                </Table.Cell>
                <Table.Cell px={6} py={4}>
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Phê duyệt"
                      onClick={() => handleApproveClick(listing)}
                      variant="ghost"
                      size="sm"
                      color="green.600"
                      _hover={{ bg: "green.50" }}
                      title="Phê duyệt tin đăng"
                    >
                      <Box as={FiCheck} w={5} h={5} />
                    </IconButton>
                    <IconButton
                      aria-label="Từ chối"
                      onClick={() => handleRejectClick(listing)}
                      variant="ghost"
                      size="sm"
                      color="red.600"
                      _hover={{ bg: "red.50" }}
                      title="Từ chối tin đăng"
                    >
                      <Box as={FiX} w={5} h={5} />
                    </IconButton>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Approve dialog — dùng ConfirmDialog gốc */}
      <ConfirmDialog
        open={isApproveOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedListing(null)
            setIsApproveOpen(false)
          }
        }}
        title="Phê duyệt tin đăng?"
        description={`Xác nhận phê duyệt tin đăng "${selectedListing?.title}"?`}
        confirmText="Phê duyệt"
        confirmColorPalette="green"
        onConfirm={handleApproveConfirm}
        isLoading={approveMutation.isPending}
      />

      {/* Reject dialog — dùng RejectListingDialog mới có nhập lý do */}
      <RejectListingDialog
        open={isRejectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedListing(null)
            setIsRejectOpen(false)
          }
        }}
        listing={selectedListing}
        onConfirm={handleRejectConfirm}
        isLoading={rejectMutation.isPending}
      />
    </>
  )
}

