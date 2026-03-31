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

interface PendingListingsTableProps {
  listings: ListingRead[]
  isLoading: boolean
}

type ActionType = "approve" | "reject" | null

export function PendingListingsTable({
  listings,
  isLoading,
}: PendingListingsTableProps) {
  const [selectedListing, setSelectedListing] = useState<ListingRead | null>(
    null,
  )
  const [actionType, setActionType] = useState<ActionType>(null)

  const approveMutation = useApproveListing()
  const rejectMutation = useRejectListing()

  const handleAction = (listing: ListingRead, type: "approve" | "reject") => {
    setSelectedListing(listing)
    setActionType(type)
  }

  const handleConfirm = () => {
    if (!selectedListing || !actionType) return

    const mutation = actionType === "approve" ? approveMutation : rejectMutation

    mutation.mutate(selectedListing.id, {
      onSuccess: () => {
        setSelectedListing(null)
        setActionType(null)
      },
    })
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
            <Table.Row bg="gray.100">
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Tiêu đề
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Giá
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Tình trạng
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Ngày tạo
              </Table.ColumnHeader>
              <Table.ColumnHeader
                px={6}
                py={3}
                fontSize="sm"
                fontWeight="semibold"
                color="gray.900"
              >
                Hành động
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
                      onClick={() => handleAction(listing, "approve")}
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
                      onClick={() => handleAction(listing, "reject")}
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

      <ConfirmDialog
        open={!!selectedListing && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedListing(null)
            setActionType(null)
          }
        }}
        title={
          actionType === "approve" ? "Phê duyệt tin đăng?" : "Từ chối tin đăng?"
        }
        description={
          actionType === "approve"
            ? `Xác nhận phê duyệt tin đăng "${selectedListing?.title}"?`
            : `Xác nhận từ chối tin đăng "${selectedListing?.title}"?`
        }
        confirmText={actionType === "approve" ? "Phê duyệt" : "Từ chối"}
        confirmColorPalette={actionType === "approve" ? "green" : "red"}
        onConfirm={handleConfirm}
        isLoading={approveMutation.isPending || rejectMutation.isPending}
      />
    </>
  )
}
