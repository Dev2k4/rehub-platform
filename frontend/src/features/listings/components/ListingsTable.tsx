import {
  Badge,
  Box,
  Flex,
  IconButton,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FiEdit2, FiEye, FiTrash2 } from "react-icons/fi"
import type { ListingRead } from "@/client"

interface ListingsTableProps {
  listings: ListingRead[]
  onEdit: (listing: ListingRead) => void
  onDelete: (listing: ListingRead) => void
  onView: (listing: ListingRead) => void
  isLoading?: boolean
}

const conditionLabels: Record<string, string> = {
  NEW: "Mới",
  LIKE_NEW: "Như mới",
  GOOD: "Tốt",
  FAIR: "Trung bình",
}

const statusConfig: Record<string, { label: string; colorPalette: string }> = {
  pending: { label: "Chờ xem xét", colorPalette: "yellow" },
  active: { label: "Đang bán", colorPalette: "green" },
  sold: { label: "Đã bán", colorPalette: "blue" },
  hidden: { label: "Ẩn", colorPalette: "gray" },
}

export function ListingsTable({
  listings,
  onEdit,
  onDelete,
  onView,
  isLoading,
}: ListingsTableProps) {
  if (isLoading) {
    return (
      <Flex align="center" justify="center" py={12}>
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  if (listings.length === 0) {
    return (
      <Flex
        align="center"
        justify="center"
        py={12}
        bg="gray.50"
        borderRadius="lg"
      >
        <VStack gap={1} textAlign="center">
          <Text color="gray.600">Bạn chưa có tin đăng nào</Text>
          <Text fontSize="sm" color="gray.500">
            Hãy tạo tin đăng đầu tiên để bắt đầu bán hàng
          </Text>
        </VStack>
      </Flex>
    )
  }

  return (
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
              Trạng thái
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
              textAlign="right"
            >
              Hành động
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {listings.map((listing) => {
            const condition =
              conditionLabels[listing.condition_grade] ||
              listing.condition_grade
            const status = statusConfig[listing.status] || {
              label: listing.status,
              colorPalette: "gray",
            }
            return (
              <Table.Row
                key={listing.id}
                _hover={{ bg: "gray.50" }}
                transition="all 0.2s"
              >
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.900">
                  <Text fontWeight="medium">{listing.title}</Text>
                  <Text fontSize="xs" color="gray.500" lineClamp={1}>
                    {listing.description}
                  </Text>
                </Table.Cell>
                <Table.Cell
                  px={6}
                  py={4}
                  fontSize="sm"
                  fontWeight="medium"
                  color="gray.900"
                >
                  {parseInt(listing.price, 10).toLocaleString("vi-VN")} ₫
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.700">
                  {condition}
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm">
                  <Badge
                    colorPalette={status.colorPalette}
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {status.label}
                  </Badge>
                </Table.Cell>
                <Table.Cell px={6} py={4} fontSize="sm" color="gray.600">
                  {new Date(listing.created_at).toLocaleDateString("vi-VN")}
                </Table.Cell>
                <Table.Cell px={6} py={4} textAlign="right">
                  <Flex align="center" justify="flex-end" gap={2}>
                    <IconButton
                      aria-label="Xem chi tiết"
                      onClick={() => onView(listing)}
                      variant="ghost"
                      size="sm"
                      color="gray.600"
                      _hover={{ color: "blue.600", bg: "blue.50" }}
                    >
                      <FiEye size={18} />
                    </IconButton>
                    <IconButton
                      aria-label="Sửa"
                      onClick={() => onEdit(listing)}
                      variant="ghost"
                      size="sm"
                      color="gray.600"
                      _hover={{ color: "orange.600", bg: "orange.50" }}
                    >
                      <FiEdit2 size={18} />
                    </IconButton>
                    <IconButton
                      aria-label="Xóa"
                      onClick={() => onDelete(listing)}
                      variant="ghost"
                      size="sm"
                      color="gray.600"
                      _hover={{ color: "red.600", bg: "red.50" }}
                    >
                      <FiTrash2 size={18} />
                    </IconButton>
                  </Flex>
                </Table.Cell>
              </Table.Row>
            )
          })}
        </Table.Body>
      </Table.Root>
    </Box>
  )
}
