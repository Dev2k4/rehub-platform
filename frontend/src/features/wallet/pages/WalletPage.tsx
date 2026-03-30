import { useState } from "react"
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Input,
  Spinner,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FiArrowLeft } from "react-icons/fi"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import {
  demoTopupWallet,
  getMyWallet,
  getWalletTransactions,
} from "@/features/wallet/api/wallet.api"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"

export function WalletPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()
  const [amount, setAmount] = useState("100000")

  const walletQuery = useQuery({
    queryKey: ["wallet", "me"],
    queryFn: getMyWallet,
    enabled: !!user,
  })

  const transactionsQuery = useQuery({
    queryKey: ["wallet", "transactions"],
    queryFn: getWalletTransactions,
    enabled: !!user,
  })

  const topupMutation = useMutation({
    mutationFn: (value: number) => demoTopupWallet(value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] })
      queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] })
    },
  })

  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" })
    return null
  }

  if (authLoading || walletQuery.isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  const wallet = walletQuery.data

  if (walletQuery.isError) {
    const message = walletQuery.error instanceof Error ? walletQuery.error.message : "Không xác định"
    return (
      <Container py={10}>
        <Text color="red.600" mb={2}>Không tải được thông tin ví.</Text>
        <Text color="gray.600" fontSize="sm" mb={4}>Chi tiết: {message}</Text>
        <Text color="gray.600" fontSize="sm" mb={4}>
          Nếu lỗi là 404, backend chưa reload route mới. Hãy restart backend rồi tải lại trang.
        </Text>
        <Button onClick={() => walletQuery.refetch()} colorPalette="blue" variant="outline">
          Thử lại
        </Button>
      </Container>
    )
  }

  if (!wallet) {
    return (
      <Container py={10}>
        <Text color="red.600">Không tải được thông tin ví.</Text>
      </Container>
    )
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="5xl" py={10}>
        <Button variant="ghost" onClick={() => navigate({ to: "/orders" })} color="blue.600" mb={6}>
          <FiArrowLeft style={{ marginRight: "0.5rem" }} />
          Quay lại đơn hàng
        </Button>

        <Heading size="lg" mb={2}>Ví demo</Heading>
        <Text color="gray.600" mb={6}>Dùng để test escrow flow, không phải tiền thật.</Text>

        <Box bg="white" borderRadius="xl" p={5} boxShadow="sm" border="1px" borderColor="gray.200" mb={6}>
          <HStack justify="space-between" align={{ base: "start", md: "center" }} flexDir={{ base: "column", md: "row" }} gap={4}>
            <VStack align="start" gap={1}>
              <Text fontSize="sm" color="gray.600">Số dư khả dụng</Text>
              <Text fontWeight="bold" fontSize="2xl">{formatCurrencyVnd(wallet.available_balance)}</Text>
              <Text fontSize="sm" color="gray.600">Số dư đang giữ escrow: {formatCurrencyVnd(wallet.locked_balance)}</Text>
            </VStack>

            <HStack>
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                min={1000}
                step={1000}
                maxW="180px"
              />
              <Button
                colorPalette="blue"
                onClick={async () => {
                  const numeric = Number(amount)
                  if (!Number.isFinite(numeric) || numeric <= 0) {
                    return
                  }
                  await topupMutation.mutateAsync(numeric)
                }}
                loading={topupMutation.isPending}
              >
                Nạp ví demo
              </Button>
            </HStack>
          </HStack>
        </Box>

        <Box bg="white" borderRadius="xl" p={5} boxShadow="sm" border="1px" borderColor="gray.200">
          <Heading size="sm" mb={4}>Lịch sử giao dịch</Heading>

          {transactionsQuery.isLoading ? (
            <Spinner />
          ) : transactionsQuery.data && transactionsQuery.data.length > 0 ? (
            <Table.Root size="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Thời gian</Table.ColumnHeader>
                  <Table.ColumnHeader>Loại</Table.ColumnHeader>
                  <Table.ColumnHeader>Chiều</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Số tiền</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {transactionsQuery.data.map((tx) => (
                  <Table.Row key={tx.id}>
                    <Table.Cell>{new Date(tx.created_at).toLocaleString("vi-VN")}</Table.Cell>
                    <Table.Cell>{tx.type}</Table.Cell>
                    <Table.Cell>{tx.direction}</Table.Cell>
                    <Table.Cell textAlign="right">{formatCurrencyVnd(tx.amount)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          ) : (
            <Text color="gray.500">Chưa có giao dịch nào.</Text>
          )}
        </Box>
      </Container>
    </Box>
  )
}
