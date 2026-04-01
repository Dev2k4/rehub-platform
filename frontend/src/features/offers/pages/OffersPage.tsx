import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { useMemo, useState } from "react"
import { FiArrowLeft, FiFilter } from "react-icons/fi"
import type { OfferStatus } from "@/client"
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
} from "@/components/ui/menu"
import {
  PaginationItems,
  PaginationNextTrigger,
  PaginationPrevTrigger,
  PaginationRoot,
} from "@/components/ui/pagination"
import { toaster } from "@/components/ui/toaster"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"
import { OfferDetailModal } from "@/features/offers/components/OfferDetailModal"
import {
  useMyReceivedOffers,
  useMySentOffers,
} from "@/features/offers/hooks/useOffers"
import { useUpdateOfferMutation } from "@/features/offers/hooks/useUpdateOfferMutation"

const OFFER_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "yellow" },
  accepted: { label: "Đã chấp nhận", color: "green" },
  rejected: { label: "Đã từ chối", color: "red" },
  countered: { label: "Đã counter", color: "blue" },
  expired: { label: "Hết hạn", color: "gray" },
}

const FILTER_OPTIONS: Array<{ value: OfferStatus | "all"; label: string }> = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "accepted", label: "Đã chấp nhận" },
  { value: "rejected", label: "Đã từ chối" },
  { value: "countered", label: "Đã counter" },
  { value: "expired", label: "Hết hạn" },
]

export function OffersPage() {
  const navigate = useNavigate()
  const [selectedOfferId, setSelectedOfferId] = useState<string | undefined>(
    undefined,
  )
  const [isOfferDetailOpen, setIsOfferDetailOpen] = useState(false)
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()
  const [receivedPage, setReceivedPage] = useState(1)
  const [sentPage, setSentPage] = useState(1)
  const [receivedFilter, setReceivedFilter] = useState<OfferStatus | "all">(
    "all",
  )
  const [sentFilter, setSentFilter] = useState<OfferStatus | "all">("all")

  const PAGE_SIZE = 10

  const sentOffersQuery = useMySentOffers({
    limit: PAGE_SIZE,
    skip: (sentPage - 1) * PAGE_SIZE,
  })
  const receivedOffersQuery = useMyReceivedOffers({
    limit: PAGE_SIZE,
    skip: (receivedPage - 1) * PAGE_SIZE,
  })
  const updateOfferMutation = useUpdateOfferMutation()

  const openOfferDetail = (offerId: string) => {
    setSelectedOfferId(offerId)
    setIsOfferDetailOpen(true)
  }

  const filteredReceivedOffers = useMemo(() => {
    if (!receivedOffersQuery.data) return []
    if (receivedFilter === "all") return receivedOffersQuery.data
    return receivedOffersQuery.data.filter((o) => o.status === receivedFilter)
  }, [receivedOffersQuery.data, receivedFilter])

  const filteredSentOffers = useMemo(() => {
    if (!sentOffersQuery.data) return []
    if (sentFilter === "all") return sentOffersQuery.data
    return sentOffersQuery.data.filter((o) => o.status === sentFilter)
  }, [sentOffersQuery.data, sentFilter])

  if (!authLoading && !isAuthenticated) {
    navigate({ to: "/auth/login" })
    return null
  }

  if (authLoading || !user) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  const [activeTab, setActiveTab] = useState<"received" | "sent">("received")

  // Logic to handle pagination count estimation since API doesn't return total
  const receivedDataCount =
    (receivedOffersQuery.data?.length ?? 0) === PAGE_SIZE
      ? (receivedPage + 1) * PAGE_SIZE
      : receivedPage * PAGE_SIZE
  const sentDataCount =
    (sentOffersQuery.data?.length ?? 0) === PAGE_SIZE
      ? (sentPage + 1) * PAGE_SIZE
      : sentPage * PAGE_SIZE

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="6xl" py={10} mx="auto">
        <Flex align="center" justify="space-between" mb={6}>
          <Button
            variant="ghost"
            onClick={() => navigate({ to: "/" })}
            color="blue.600"
            borderRadius="xl"
            _hover={{ bg: "blue.50" }}
          >
            <FiArrowLeft style={{ marginRight: "0.5rem" }} />
            Quay lại
          </Button>
        </Flex>

        <Box mb={10}>
          <Heading size="3xl" mb={3} color="gray.900" fontWeight="extrabold">
            Quản lý Thương lượng
          </Heading>
          <Text color="gray.500" fontSize="lg">
            Xem và quản lý các yêu cầu thương lượng giá từ người mua và người
            bán.
          </Text>
        </Box>

        <HStack
          mb={10}
          gap={1.5}
          bg="whiteAlpha.800"
          backdropFilter="blur(20px)"
          p={1.5}
          borderRadius="2xl"
          display="inline-flex"
          border="1px"
          borderColor="whiteAlpha.400"
          boxShadow="0 4px 20px rgba(0,0,0,0.04)"
        >
          <Button
            onClick={() => setActiveTab("received")}
            variant={activeTab === "received" ? "solid" : "ghost"}
            colorPalette={activeTab === "received" ? "blue" : "gray"}
            borderRadius="xl"
            px={8}
            size="md"
            fontWeight="bold"
          >
            Offers nhận được
          </Button>
          <Button
            onClick={() => setActiveTab("sent")}
            variant={activeTab === "sent" ? "solid" : "ghost"}
            colorPalette={activeTab === "sent" ? "blue" : "gray"}
            borderRadius="xl"
            px={8}
            size="md"
            fontWeight="bold"
          >
            Offers đã gửi
          </Button>
        </HStack>

        <Box
          bg="whiteAlpha.800"
          backdropFilter="blur(20px)"
          border="1px"
          borderColor="whiteAlpha.400"
          borderRadius="2xl"
          p={{ base: 6, md: 10 }}
          boxShadow="0 10px 40px rgba(0,0,0,0.04)"
        >
          {activeTab === "received" ? (
            <Box>
              <Flex justify="space-between" align="center" mb={10} gap={4}>
                <Heading size="lg" color="gray.800" fontWeight="extrabold">
                  Offers nhận được
                </Heading>

                <MenuRoot>
                  <MenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      borderRadius="xl"
                      px={4}
                    >
                      <FiFilter style={{ marginRight: "0.5rem" }} />
                      {FILTER_OPTIONS.find((o) => o.value === receivedFilter)
                        ?.label || "Lọc"}
                    </Button>
                  </MenuTrigger>
                  <MenuContent borderRadius="xl" boxShadow="xl">
                    {FILTER_OPTIONS.map((opt) => (
                      <MenuItem
                        key={opt.value}
                        value={opt.value}
                        onClick={() => {
                          setReceivedFilter(opt.value)
                          setReceivedPage(1)
                        }}
                        bg={
                          receivedFilter === opt.value
                            ? "blue.50"
                            : "transparent"
                        }
                        color={
                          receivedFilter === opt.value ? "blue.600" : "inherit"
                        }
                        fontWeight={
                          receivedFilter === opt.value ? "bold" : "normal"
                        }
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </MenuContent>
                </MenuRoot>
              </Flex>

              {receivedOffersQuery.isLoading ? (
                <Flex justify="center" py={12}>
                  <Spinner size="lg" color="blue.500" />
                </Flex>
              ) : filteredReceivedOffers.length > 0 ? (
                <VStack align="stretch" gap={6}>
                  {filteredReceivedOffers.map((offer) => {
                    const status = OFFER_STATUS_META[offer.status] ?? {
                      label: offer.status,
                      color: "gray",
                    }
                    return (
                      <Box
                        key={offer.id}
                        bg="whiteAlpha.600"
                        border="1px"
                        borderColor="whiteAlpha.400"
                        borderRadius="2xl"
                        p={6}
                        _hover={{
                          borderColor: "blue.200",
                          bg: "white",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                          transform: "translateY(-1px)",
                        }}
                        transition="all 0.3s"
                      >
                        <Flex
                          justify="space-between"
                          align={{ base: "start", md: "center" }}
                          direction={{ base: "column", md: "row" }}
                          gap={4}
                        >
                          <Box>
                            <Flex align="center" gap={3} mb={3}>
                              <Text
                                fontWeight="bold"
                                fontSize="2xl"
                                color="blue.600"
                                letterSpacing="tight"
                              >
                                {formatCurrencyVnd(
                                  Math.floor(Number(offer.offer_price)),
                                )}
                              </Text>
                              <Badge
                                colorPalette={status.color as any}
                                variant="surface"
                                size="lg"
                                borderRadius="full"
                                px={4}
                              >
                                {status.label}
                              </Badge>
                            </Flex>
                            <HStack fontSize="sm" color="gray.500" gap={4}>
                              <Text>
                                Mã:{" "}
                                <Text
                                  as="span"
                                  fontFamily="mono"
                                  color="gray.400"
                                >
                                  {offer.id.slice(0, 8)}
                                </Text>
                              </Text>
                              <Text>•</Text>
                              <Text>
                                {new Date(offer.created_at).toLocaleDateString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </Text>
                            </HStack>
                          </Box>

                          <HStack gap={3}>
                            {offer.status === "pending" && (
                              <>
                                <Button
                                  size="md"
                                  colorPalette="green"
                                  borderRadius="xl"
                                  px={6}
                                  onClick={() =>
                                    updateOfferMutation.mutate(
                                      {
                                        offerId: offer.id,
                                        data: { status: "accepted" },
                                      },
                                      {
                                        onSuccess: () =>
                                          toaster.create({
                                            title: "Đã chấp nhận Offer",
                                            type: "success",
                                          }),
                                        onError: (err: any) =>
                                          toaster.create({
                                            title:
                                              err?.message ||
                                              "Lỗi cập nhật Offer",
                                            type: "error",
                                          }),
                                      },
                                    )
                                  }
                                  loading={updateOfferMutation.isPending}
                                >
                                  Chấp nhận
                                </Button>
                                <Button
                                  size="md"
                                  variant="outline"
                                  colorPalette="red"
                                  borderRadius="xl"
                                  px={6}
                                  onClick={() =>
                                    updateOfferMutation.mutate(
                                      {
                                        offerId: offer.id,
                                        data: { status: "rejected" },
                                      },
                                      {
                                        onSuccess: () =>
                                          toaster.create({
                                            title: "Đã từ chối Offer",
                                            type: "success",
                                          }),
                                        onError: (err: any) =>
                                          toaster.create({
                                            title:
                                              err?.message ||
                                              "Lỗi cập nhật Offer",
                                            type: "error",
                                          }),
                                      },
                                    )
                                  }
                                  loading={updateOfferMutation.isPending}
                                >
                                  Từ chối
                                </Button>
                                <Button
                                  size="md"
                                  variant="surface"
                                  colorPalette="blue"
                                  borderRadius="xl"
                                  px={6}
                                  onClick={() => openOfferDetail(offer.id)}
                                >
                                  Đàm phán lại
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              colorPalette="gray"
                              onClick={() => openOfferDetail(offer.id)}
                              borderRadius="xl"
                            >
                              Chi tiết
                            </Button>
                          </HStack>
                        </Flex>
                      </Box>
                    )
                  })}

                  <Flex justify="center" mt={8}>
                    <PaginationRoot
                      count={receivedDataCount}
                      pageSize={PAGE_SIZE}
                      page={receivedPage}
                      onPageChange={(e) => setReceivedPage(e.page)}
                    >
                      <HStack>
                        <PaginationPrevTrigger />
                        <PaginationItems />
                        <PaginationNextTrigger />
                      </HStack>
                    </PaginationRoot>
                  </Flex>
                </VStack>
              ) : (
                <Box py={24} textAlign="center">
                  <Text fontSize="lg" color="gray.400" fontWeight="medium">
                    Không tìm thấy offer nào phù hợp.
                  </Text>
                </Box>
              )}
            </Box>
          ) : (
            <Box>
              <Flex justify="space-between" align="center" mb={10} gap={4}>
                <Heading size="lg" color="gray.800" fontWeight="extrabold">
                  Offers đã gửi
                </Heading>

                <MenuRoot>
                  <MenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      borderRadius="xl"
                      px={4}
                    >
                      <FiFilter style={{ marginRight: "0.5rem" }} />
                      {FILTER_OPTIONS.find((o) => o.value === sentFilter)
                        ?.label || "Lọc"}
                    </Button>
                  </MenuTrigger>
                  <MenuContent borderRadius="xl" boxShadow="xl">
                    {FILTER_OPTIONS.map((opt) => (
                      <MenuItem
                        key={opt.value}
                        value={opt.value}
                        onClick={() => {
                          setSentFilter(opt.value)
                          setSentPage(1)
                        }}
                        bg={
                          sentFilter === opt.value ? "blue.50" : "transparent"
                        }
                        color={
                          sentFilter === opt.value ? "blue.600" : "inherit"
                        }
                        fontWeight={
                          sentFilter === opt.value ? "bold" : "normal"
                        }
                      >
                        {opt.label}
                      </MenuItem>
                    ))}
                  </MenuContent>
                </MenuRoot>
              </Flex>

              {sentOffersQuery.isLoading ? (
                <Flex justify="center" py={12}>
                  <Spinner size="lg" color="blue.500" />
                </Flex>
              ) : filteredSentOffers.length > 0 ? (
                <VStack align="stretch" gap={6}>
                  {filteredSentOffers.map((offer) => {
                    const status = OFFER_STATUS_META[offer.status] ?? {
                      label: offer.status,
                      color: "gray",
                    }
                    return (
                      <Box
                        key={offer.id}
                        bg="whiteAlpha.600"
                        border="1px"
                        borderColor="whiteAlpha.400"
                        borderRadius="2xl"
                        p={6}
                        _hover={{
                          borderColor: "blue.200",
                          bg: "white",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
                          transform: "translateY(-1px)",
                        }}
                        transition="all 0.3s"
                      >
                        <Flex
                          justify="space-between"
                          align={{ base: "start", md: "center" }}
                          direction={{ base: "column", md: "row" }}
                          gap={4}
                        >
                          <Box>
                            <Flex align="center" gap={3} mb={3}>
                              <Text
                                fontWeight="bold"
                                fontSize="2xl"
                                color="blue.600"
                                letterSpacing="tight"
                              >
                                {formatCurrencyVnd(
                                  Math.floor(Number(offer.offer_price)),
                                )}
                              </Text>
                              <Badge
                                colorPalette={status.color as any}
                                variant="surface"
                                size="lg"
                                borderRadius="full"
                                px={4}
                              >
                                {status.label}
                              </Badge>
                            </Flex>
                            <HStack fontSize="sm" color="gray.500" gap={4}>
                              <Text>
                                Mã:{" "}
                                <Text
                                  as="span"
                                  fontFamily="mono"
                                  color="gray.400"
                                >
                                  {offer.id.slice(0, 8)}
                                </Text>
                              </Text>
                              <Text>•</Text>
                              <Text>
                                {new Date(offer.created_at).toLocaleDateString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </Text>
                            </HStack>
                          </Box>
                          <Button
                            variant="ghost"
                            colorPalette="gray"
                            onClick={() => openOfferDetail(offer.id)}
                            borderRadius="xl"
                          >
                            Chi tiết
                          </Button>
                        </Flex>
                      </Box>
                    )
                  })}

                  <Flex justify="center" mt={8}>
                    <PaginationRoot
                      count={sentDataCount}
                      pageSize={PAGE_SIZE}
                      page={sentPage}
                      onPageChange={(e) => setSentPage(e.page)}
                    >
                      <HStack>
                        <PaginationPrevTrigger />
                        <PaginationItems />
                        <PaginationNextTrigger />
                      </HStack>
                    </PaginationRoot>
                  </Flex>
                </VStack>
              ) : (
                <Box py={24} textAlign="center">
                  <Text fontSize="lg" color="gray.400" fontWeight="medium">
                    Không tìm thấy offer nào phù hợp.
                  </Text>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Container>

      <OfferDetailModal
        isOpen={isOfferDetailOpen}
        onOpenChange={setIsOfferDetailOpen}
        offerId={selectedOfferId}
      />
    </Box>
  )
}
