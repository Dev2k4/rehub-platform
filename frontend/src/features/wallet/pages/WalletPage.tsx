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
  Table,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { FiArrowLeft } from "react-icons/fi"
import { toaster } from "@/components/ui/toaster"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"
import {
  demoTopupWallet,
  getMyWallet,
  getWalletTransactions,
} from "@/features/wallet/api/wallet.api"

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
    onSuccess: (_, value) => {
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] })
      queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] })
      toaster.create({
        title: `Nạp thành công ${formatCurrencyVnd(String(value))}`,
        type: "success",
      })
    },
    onError: (e: any) => {
      toaster.create({ title: e?.message || "Lỗi nạp ví", type: "error" })
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
    const message =
      walletQuery.error instanceof Error
        ? walletQuery.error.message
        : "Không xác định"
    return (
      <Container
        maxW="1440px"
        mx="auto"
        px={{ base: "1rem", md: "2%" }}
        py={10}
      >
        <Text color="red.600" mb={2}>
          Không tải được thông tin ví.
        </Text>
        <Text color="gray.600" fontSize="sm" mb={4}>
          Chi tiết: {message}
        </Text>
        <Text color="gray.600" fontSize="sm" mb={4}>
          Nếu lỗi là 404, backend chưa reload route mới. Hãy restart backend rồi
          tải lại trang.
        </Text>
        <Button
          onClick={() => walletQuery.refetch()}
          colorPalette="blue"
          variant="outline"
        >
          Thử lại
        </Button>
      </Container>
    )
  }

  if (!wallet) {
    return (
      <Container
        maxW="1440px"
        mx="auto"
        px={{ base: "1rem", md: "2%" }}
        py={10}
      >
        <Text color="red.600">Không tải được thông tin ví.</Text>
      </Container>
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
        <Button
          variant="ghost"
          onClick={() => navigate({ to: "/orders" })}
          color="blue.600"
          mb={6}
          borderRadius="xl"
          _hover={{ bg: "blue.50" }}
          px={4}
        >
          <FiArrowLeft style={{ marginRight: "0.5rem" }} />
          Quay lại đơn hàng
        </Button>

        <Box mb={8}>
          <Heading size="xl" mb={2} color="gray.900">
            Ví demo
          </Heading>
          <Text color="gray.500">
            Dùng để test giao dịch thanh toán và Escrow, không phải tiền thật.
          </Text>
        </Box>

        <Box
          borderRadius="2xl"
          p={8}
          boxShadow="0 10px 40px rgba(66,153,225,0.25)"
          color="white"
          mb={8}
          style={{
            background:
              "linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #06B6D4 100%)",
          }}
        >
          <HStack
            justify="space-between"
            align={{ base: "start", md: "center" }}
            flexDir={{ base: "column", md: "row" }}
            gap={6}
          >
            <VStack align="start" gap={2}>
              <Text fontSize="sm" fontWeight="medium" opacity={0.8}>
                SỐ DƯ KHẢ DỤNG
              </Text>
              <Text fontWeight="bold" fontSize="4xl" letterSpacing="tight">
                {formatCurrencyVnd(wallet.available_balance)}
              </Text>
              <HStack
                mt={1}
                bg="whiteAlpha.200"
                px={4}
                py={1.5}
                borderRadius="full"
              >
                <Text fontSize="sm" opacity={0.9}>
                  Đang giữ escrow:
                </Text>
                <Text fontSize="sm" fontWeight="bold">
                  {formatCurrencyVnd(wallet.locked_balance)}
                </Text>
              </HStack>
            </VStack>

            <Box
              bg="whiteAlpha.900"
              backdropFilter="blur(8px)"
              p={1.5}
              borderRadius="xl"
              boxShadow="xl"
              w={{ base: "full", md: "auto" }}
            >
              <HStack gap={2}>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min={1000}
                  step={1000}
                  w={{ base: "full", md: "150px" }}
                  bg="transparent"
                  border="none"
                  color="gray.800"
                  fontWeight="medium"
                  px={4}
                  _focus={{ boxShadow: "none" }}
                />
                <Button
                  colorPalette="blue"
                  borderRadius="lg"
                  px={6}
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
            </Box>
          </HStack>
        </Box>

        <Box
          bg="whiteAlpha.800"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          p={6}
          boxShadow="0 10px 40px rgba(0,0,0,0.06)"
          border="1px"
          borderColor="whiteAlpha.400"
        >
          <Heading size="md" mb={6} color="gray.800">
            Lịch sử giao dịch
          </Heading>

          {transactionsQuery.isLoading ? (
            <Flex justify="center" py={10}>
              <Spinner color="blue.500" />
            </Flex>
          ) : transactionsQuery.data && transactionsQuery.data.length > 0 ? (
            <Box overflowX="auto">
              <Table.Root size="md" variant="line">
                <Table.Header>
                  <Table.Row bg="gray.50">
                    <Table.ColumnHeader
                      color="gray.600"
                      py={3}
                      borderRadius="tl-lg"
                    >
                      Thời gian
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" py={3}>
                      Loại
                    </Table.ColumnHeader>
                    <Table.ColumnHeader color="gray.600" py={3}>
                      Chiều
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      textAlign="right"
                      color="gray.600"
                      py={3}
                      borderRadius="tr-lg"
                    >
                      Số tiền
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {transactionsQuery.data.map((tx) => (
                    <Table.Row
                      key={tx.id}
                      _hover={{ bg: "gray.50" }}
                      transition="all 0.2s"
                    >
                      <Table.Cell color="gray.600">
                        {new Date(tx.created_at).toLocaleString("vi-VN")}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette="gray" variant="subtle">
                          {tx.type}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge
                          colorPalette={
                            tx.direction === "credit" ? "green" : "red"
                          }
                          variant="subtle"
                        >
                          {tx.direction === "credit" ? "Cộng (+)" : "Trừ (-)"}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell
                        textAlign="right"
                        fontWeight="bold"
                        color={
                          tx.direction === "credit" ? "green.600" : "gray.900"
                        }
                      >
                        {tx.direction === "credit" ? "+" : "-"}
                        {formatCurrencyVnd(tx.amount)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          ) : (
            <Text color="gray.500" textAlign="center" py={8}>
              Chưa có giao dịch nào.
            </Text>
          )}
        </Box>
      </Container>
    </Box>
  )
}
