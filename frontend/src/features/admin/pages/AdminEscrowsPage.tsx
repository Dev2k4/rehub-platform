import { useMemo, useState } from "react"
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
} from "@chakra-ui/react"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"
import {
  useAdminResolveEscrow,
  useDisputedEscrows,
} from "@/features/admin/hooks/useAdminEscrows"

export function AdminEscrowsPage() {
  const [note, setNote] = useState("")
  const [searchOrderId, setSearchOrderId] = useState("")
  const { data: escrows = [], isLoading, isError } = useDisputedEscrows({ limit: 100 })
  const resolveMutation = useAdminResolveEscrow()

  const filteredEscrows = useMemo(() => {
    const keyword = searchOrderId.trim().toLowerCase()
    if (!keyword) {
      return escrows
    }
    return escrows.filter((escrow) => escrow.order_id.toLowerCase().includes(keyword))
  }, [escrows, searchOrderId])

  const handleResolve = async (orderId: string, result: "release" | "refund") => {
    await resolveMutation.mutateAsync({
      orderId,
      result,
      note: note.trim() || undefined,
    })
  }

  return (
    <Container maxW="7xl" px={0}>
      <Box mb={6}>
        <Heading as="h1" size="lg" color="gray.900" mb={2}>
          Escrow Tranh Chấp
        </Heading>
        <Text color="gray.600" fontSize="sm">
          Quản lý và xử lý tranh chấp escrow demo trước khi tích hợp thanh toán thật.
        </Text>
      </Box>

      <Box bg="white" borderRadius="lg" boxShadow="sm" p={4} mb={6}>
        <VStack align="stretch" gap={3}>
          <Input
            placeholder="Lọc theo Order ID..."
            value={searchOrderId}
            onChange={(e) => setSearchOrderId(e.target.value)}
          />
          <Input
            placeholder="Ghi chú resolve (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </VStack>
      </Box>

      <Box bg="white" borderRadius="lg" boxShadow="sm" p={4}>
        {isLoading ? (
          <Flex py={10} justify="center">
            <Spinner color="blue.500" />
          </Flex>
        ) : isError ? (
          <Text color="red.600">Không tải được danh sách escrow tranh chấp.</Text>
        ) : filteredEscrows.length === 0 ? (
          <Text color="gray.500">Không có escrow tranh chấp nào.</Text>
        ) : (
          <VStack align="stretch" gap={4}>
            {filteredEscrows.map((escrow) => (
              <Box
                key={escrow.id}
                border="1px"
                borderColor="gray.200"
                borderRadius="lg"
                p={4}
              >
                <Flex justify="space-between" align={{ base: "start", md: "center" }} direction={{ base: "column", md: "row" }} gap={3}>
                  <Box>
                    <Text fontSize="sm"><b>Order:</b> {escrow.order_id}</Text>
                    <Text fontSize="sm"><b>Escrow:</b> {escrow.id}</Text>
                    <Text fontSize="sm"><b>Amount:</b> {formatCurrencyVnd(escrow.amount)}</Text>
                    <Badge mt={2} colorPalette="red">{escrow.status}</Badge>
                  </Box>
                  <HStack>
                    <Button
                      size="sm"
                      colorPalette="green"
                      onClick={() => handleResolve(escrow.order_id, "release")}
                      loading={resolveMutation.isPending}
                    >
                      Resolve Release
                    </Button>
                    <Button
                      size="sm"
                      colorPalette="red"
                      variant="outline"
                      onClick={() => handleResolve(escrow.order_id, "refund")}
                      loading={resolveMutation.isPending}
                    >
                      Resolve Refund
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
    </Container>
  )
}
