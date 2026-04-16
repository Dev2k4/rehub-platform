import {
  Badge,
  Box,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Table,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { FiSearch, FiShoppingBag } from "react-icons/fi";
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils";
import { useAdminOrders } from "../hooks/useAdminOrders";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";

function statusMeta(status: string): { label: string; color: string } {
  switch (status) {
    case "pending":
      return { label: "Chờ xử lý", color: "yellow" };
    case "completed":
      return { label: "Hoàn thành", color: "green" };
    case "cancelled":
      return { label: "Đã hủy", color: "red" };
    default:
      return { label: status, color: "gray" };
  }
}

export function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useAdminOrders({ limit: 200 });

  const filtered = orders.filter(
    (o) =>
      !search ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer_id.toLowerCase().includes(search.toLowerCase()),
  );

  const paginatedOrders = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <Container maxW="7xl" px={0}>
      {/* Header */}
      <Flex align="center" gap={3} mb={6}>
        <Flex
          w={10}
          h={10}
          align="center"
          justify="center"
          borderRadius="xl"
          bg="green.50"
        >
          <Box as={FiShoppingBag} w={5} h={5} color="green.500" />
        </Flex>
        <Box>
          <Heading as="h1" fontSize="1.4rem" fontWeight="800" color="gray.900">
            Quản lý đơn hàng
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Theo dõi tất cả giao dịch mua bán trên hệ thống
          </Text>
        </Box>
      </Flex>

      {/* Search */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="1.25rem"
        boxShadow="0 2px 12px rgba(0,0,0,0.04)"
        p={4}
        mb={5}
      >
        <Box position="relative">
          <Box
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            as={FiSearch}
            color="gray.400"
            w={4}
            h={4}
            zIndex={1}
          />
          <Input
            placeholder="Tìm theo Mã đơn hoặc ID người mua..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            pl={9}
            borderRadius="xl"
          />
        </Box>
      </Box>

      {/* Table */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="1.25rem"
        boxShadow="0 2px 12px rgba(0,0,0,0.04)"
        overflow="hidden"
      >
        {isLoading ? (
          <Flex
            py={16}
            justify="center"
            align="center"
            direction="column"
            gap={3}
          >
            <Spinner size="lg" color="green.400" />
            <Text color="gray.500" fontSize="sm">
              Đang tải đơn hàng...
            </Text>
          </Flex>
        ) : isError ? (
          <Flex py={16} justify="center">
            <Text color="red.500" fontWeight="600">
              Không tải được danh sách đơn hàng.
            </Text>
          </Flex>
        ) : filtered.length === 0 ? (
          <Flex py={16} justify="center">
            <Text color="gray.400">
              {search
                ? "Không tìm thấy đơn hàng phù hợp"
                : "Chưa có đơn hàng nào."}
            </Text>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table.Root size="sm">
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
                    Mã đơn
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
                    Người mua
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
                    Người bán
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    px={5}
                    py={3}
                    textAlign="right"
                    fontSize="xs"
                    fontWeight="700"
                    textTransform="uppercase"
                    color="gray.500"
                    letterSpacing="wide"
                  >
                    Giá trị
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
                    Trạng thái
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
                    Ngày tạo
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {paginatedOrders.map((order) => {
                  const status = statusMeta(order.status);
                  return (
                    <Table.Row
                      key={order.id}
                      _hover={{ bg: "gray.50" }}
                      transition="background 0.15s"
                    >
                      <Table.Cell px={5} py={3.5}>
                        <Text
                          fontSize="xs"
                          fontFamily="mono"
                          color="gray.500"
                          maxW="120px"
                          truncate
                        >
                          {order.id.slice(0, 10)}...
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={5} py={3.5}>
                        <Text
                          fontSize="xs"
                          fontFamily="mono"
                          color="gray.500"
                          maxW="120px"
                          truncate
                        >
                          {order.buyer_id.slice(0, 10)}...
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={5} py={3.5}>
                        <Text
                          fontSize="xs"
                          fontFamily="mono"
                          color="gray.500"
                          maxW="120px"
                          truncate
                        >
                          {order.seller_id.slice(0, 10)}...
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={5} py={3.5} textAlign="right">
                        <Text fontWeight="700" color="green.600" fontSize="sm">
                          {formatCurrencyVnd(order.final_price)}
                        </Text>
                      </Table.Cell>
                      <Table.Cell px={5} py={3.5}>
                        <Badge
                          colorPalette={status.color as any}
                          variant="subtle"
                          borderRadius="full"
                          px={3}
                          fontSize="xs"
                        >
                          {status.label}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell px={5} py={3.5}>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(order.created_at).toLocaleDateString(
                            "vi-VN",
                          )}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Box>

      <Flex
        justify="space-between"
        align="center"
        mt={4}
        flexDirection={{ base: "column", sm: "row" }}
        gap={4}
      >
        <HStack gap={4} fontSize="sm" color="gray.500">
          <Text>
            Tổng: <b>{orders.length}</b> đơn hàng
          </Text>
          {search && (
            <Text>
              Tìm thấy: <b>{filtered.length}</b>
            </Text>
          )}
        </HStack>

        <PaginationRoot
          count={filtered.length}
          pageSize={pageSize}
          page={page}
          onPageChange={(e) => setPage(e.page)}
          siblingCount={1}
        >
          <HStack gap={2}>
            <PaginationPrevTrigger />
            <PaginationItems />
            <PaginationNextTrigger />
          </HStack>
        </PaginationRoot>
      </Flex>
    </Container>
  );
}
