import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiDollarSign,
  FiHash,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import { toaster } from "@/components/ui/toaster";
import {
  useAdminResolveEscrow,
  useDisputedEscrows,
} from "@/features/admin/hooks/useAdminEscrows";
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils";
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination";

export function AdminEscrowsPage() {
  const [note, setNote] = useState("");
  const [searchOrderId, setSearchOrderId] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const {
    data: escrows = [],
    isLoading,
    isError,
  } = useDisputedEscrows({ limit: 100 });
  const resolveMutation = useAdminResolveEscrow();

  const filteredEscrows = useMemo(() => {
    const keyword = searchOrderId.trim().toLowerCase();
    if (!keyword) return escrows;
    return escrows.filter((escrow) =>
      escrow.order_id.toLowerCase().includes(keyword),
    );
  }, [escrows, searchOrderId]);

  const paginatedEscrows = filteredEscrows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const handleResolve = async (
    orderId: string,
    result: "release" | "refund",
  ) => {
    try {
      await resolveMutation.mutateAsync({
        orderId,
        result,
        note: note.trim() || undefined,
      });
      toaster.create({
        title:
          result === "release"
            ? "Đã giải phóng tiền cho người bán"
            : "Đã hoàn tiền cho người mua",
        type: "success",
      });
    } catch (e: any) {
      toaster.create({
        title: e?.message || "Lỗi xử lý tranh chấp",
        type: "error",
      });
    }
  };

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
          bg="red.50"
        >
          <Box as={FiShield} w={5} h={5} color="red.500" />
        </Flex>
        <Box>
          <Heading as="h1" fontSize="1.4rem" fontWeight="800" color="gray.900">
            Xử lý tranh chấp
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Giải quyết các escrow đang bị tranh chấp trên hệ thống
          </Text>
        </Box>
      </Flex>

      {/* Bộ lọc */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.100"
        borderRadius="1.25rem"
        boxShadow="0 2px 12px rgba(0,0,0,0.04)"
        p={5}
        mb={5}
      >
        <Heading as="h3" fontSize="sm" fontWeight="700" color="gray.700" mb={4}>
          Bộ lọc tìm kiếm
        </Heading>
        <HStack gap={4} wrap="wrap">
          <Box flex={1} minW="200px" position="relative">
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
              placeholder="Tìm theo Mã đơn hàng..."
              value={searchOrderId}
              onChange={(e) => {
                setSearchOrderId(e.target.value);
                setPage(1);
              }}
              pl={9}
              borderRadius="xl"
            />
          </Box>
          <Box flex={1} minW="200px" position="relative">
            <Box
              position="absolute"
              left={3}
              top="50%"
              transform="translateY(-50%)"
              as={FiAlertCircle}
              color="gray.400"
              w={4}
              h={4}
              zIndex={1}
            />
            <Input
              placeholder="Ghi chú khi xử lý (tùy chọn)..."
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
              }}
              pl={9}
              borderRadius="xl"
            />
          </Box>
        </HStack>
      </Box>

      {/* Results */}
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
            direction="column"
            gap={3}
            align="center"
          >
            <Spinner size="lg" color="red.400" />
            <Text color="gray.500" fontSize="sm">
              Đang tải danh sách tranh chấp...
            </Text>
          </Flex>
        ) : isError ? (
          <Flex
            py={16}
            justify="center"
            align="center"
            direction="column"
            gap={2}
          >
            <Box as={FiAlertCircle} w={8} h={8} color="red.400" />
            <Text color="red.600" fontWeight="600">
              Không tải được danh sách tranh chấp
            </Text>
          </Flex>
        ) : filteredEscrows.length === 0 ? (
          <Flex
            py={16}
            justify="center"
            align="center"
            direction="column"
            gap={2}
          >
            <Box as={FiShield} w={10} h={10} color="gray.300" />
            <Text color="gray.500" fontWeight="600">
              {searchOrderId
                ? "Không tìm thấy kết quả phù hợp"
                : "Không có tranh chấp nào"}
            </Text>
          </Flex>
        ) : (
          <VStack align="stretch" gap={0} divideY="1px">
            {paginatedEscrows.map((escrow) => (
              <Box
                key={escrow.id}
                p={5}
                _hover={{ bg: "gray.50" }}
                transition="background 0.15s"
              >
                <Flex
                  justify="space-between"
                  align={{ base: "start", md: "center" }}
                  direction={{ base: "column", md: "row" }}
                  gap={4}
                >
                  {/* Info */}
                  <Box>
                    <HStack gap={2} mb={2}>
                      <Badge colorPalette="red" borderRadius="full" px={2}>
                        Tranh chấp
                      </Badge>
                      <Badge
                        colorPalette="gray"
                        borderRadius="full"
                        px={2}
                        variant="outline"
                      >
                        {escrow.status}
                      </Badge>
                    </HStack>
                    <HStack gap={3} mb={1}>
                      <Box as={FiHash} w={4} h={4} color="gray.400" />
                      <Text fontSize="sm" color="gray.700">
                        <Text as="span" fontWeight="700">
                          Đơn hàng:
                        </Text>{" "}
                        <Text
                          as="span"
                          fontFamily="mono"
                          fontSize="xs"
                          color="gray.500"
                        >
                          {escrow.order_id}
                        </Text>
                      </Text>
                    </HStack>
                    <HStack gap={3}>
                      <Box as={FiDollarSign} w={4} h={4} color="gray.400" />
                      <Text fontSize="sm" color="gray.700">
                        <Text as="span" fontWeight="700">
                          Giá trị:
                        </Text>{" "}
                        <Text as="span" color="green.600" fontWeight="700">
                          {formatCurrencyVnd(escrow.amount)}
                        </Text>
                      </Text>
                    </HStack>
                  </Box>
                  {/* Actions */}
                  <HStack gap={3}>
                    <Button
                      size="sm"
                      colorPalette="green"
                      borderRadius="xl"
                      onClick={() => handleResolve(escrow.order_id, "release")}
                      loading={resolveMutation.isPending}
                      px={5}
                    >
                      Giải phóng tiền
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="red"
                      variant="outline"
                      borderRadius="xl"
                      onClick={() => handleResolve(escrow.order_id, "refund")}
                      loading={resolveMutation.isPending}
                      px={5}
                    >
                      Hoàn tiền
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
      <Flex
        justify="space-between"
        align="center"
        mt={4}
        flexDirection={{ base: "column", sm: "row" }}
        gap={4}
      >
        <Text fontSize="sm" color="gray.500">
          Tổng cộng <b>{filteredEscrows.length}</b>/{escrows.length} tranh chấp
        </Text>

        <PaginationRoot
          count={filteredEscrows.length}
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
