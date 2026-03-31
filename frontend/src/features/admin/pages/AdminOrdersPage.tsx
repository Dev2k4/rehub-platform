import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"
import { useAdminOrders } from "../hooks/useAdminOrders"

function statusMeta(status: string): { label: string; color: string } {
  switch (status) {
    case "pending":
      return { label: "Chờ xử lý", color: "yellow" }
    case "completed":
      return { label: "Hoàn thành", color: "green" }
    case "cancelled":
      return { label: "Đã hủy", color: "red" }
    default:
      return { label: status, color: "gray" }
  }
}

export function AdminOrdersPage() {
  const { data: orders = [], isLoading, isError } = useAdminOrders({ limit: 200 })

  return (
    <Container maxW="7xl" px={0}>
      <Box mb={6}>
        <Heading as="h1" size="lg" color="gray.900" mb={2}>
          Danh sách đơn hàng
        </Heading>
        <Text color="gray.600" fontSize="sm">
          Theo dõi tất cả đơn hàng trên hệ thống
        </Text>
      </Box>

      <Box
        bg="whiteAlpha.800"
        backdropFilter="blur(20px)"
        border="1px"
        borderColor="whiteAlpha.400"
        borderRadius="lg"
        boxShadow="0 10px 40px rgba(0,0,0,0.06)"
        overflow="hidden"
      >
        {isLoading ? (
          <Flex justify="center" py={12}>
            <Spinner size="lg" color="blue.500" />
          </Flex>
        ) : isError ? (
          <Flex justify="center" py={12}>
            <Text color="red.600">Không tải được danh sách đơn hàng.</Text>
          </Flex>
        ) : orders.length === 0 ? (
          <Flex justify="center" py={12}>
            <Text color="gray.500">Chưa có đơn hàng nào.</Text>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="md">
              <Table.Header>
                <Table.Row bg="gray.100">
                  <Table.ColumnHeader px={4}>Mã đơn</Table.ColumnHeader>
                  <Table.ColumnHeader px={4}>Buyer</Table.ColumnHeader>
                  <Table.ColumnHeader px={4}>Seller</Table.ColumnHeader>
                  <Table.ColumnHeader px={4} textAlign="right">
                    Giá trị
                  </Table.ColumnHeader>
                  <Table.ColumnHeader px={4}>Trạng thái</Table.ColumnHeader>
                  <Table.ColumnHeader px={4}>Tạo lúc</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((order) => {
                  const status = statusMeta(order.status)
                  return (
                    <Table.Row key={order.id} _hover={{ bg: "gray.50" }}>
                      <Table.Cell px={4}>
                        <Text fontSize="xs" fontFamily="mono" color="gray.600">
                          {order.id}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4}>
                        <Text fontSize="xs" fontFamily="mono" color="gray.600">
                          {order.buyer_id}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4}>
                        <Text fontSize="xs" fontFamily="mono" color="gray.600">
                          {order.seller_id}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={4} textAlign="right" fontWeight="semibold">
                        {formatCurrencyVnd(order.final_price)}
                      </Table.Cell>
                      <Table.Cell px={4}>
                        <Badge colorPalette={status.color as any} variant="subtle">
                          {status.label}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={4}>
                        {new Date(order.created_at).toLocaleString("vi-VN")}
                      </Table.Cell>
                    </Table.Row>
                  )
                })}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>

      <Text mt={4} fontSize="sm" color="gray.600">
        Tổng: {orders.length} đơn hàng
      </Text>
    </Container>
  )
}
