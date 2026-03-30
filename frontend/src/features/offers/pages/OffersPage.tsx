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
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { useMyReceivedOffers, useMySentOffers } from "@/features/offers/hooks/useOffers"
import { useUpdateOfferMutation } from "@/features/offers/hooks/useUpdateOfferMutation"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"

const OFFER_STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ xử lý", color: "yellow" },
  accepted: { label: "Đã chấp nhận", color: "green" },
  rejected: { label: "Đã từ chối", color: "red" },
  countered: { label: "Đã counter", color: "blue" },
  expired: { label: "Hết hạn", color: "gray" },
}

export function OffersPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuthUser()
  const sentOffersQuery = useMySentOffers({ limit: 20 })
  const receivedOffersQuery = useMyReceivedOffers({ limit: 20 })
  const updateOfferMutation = useUpdateOfferMutation()

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

  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="6xl" py={8}>
        <Heading size="lg" mb={6}>Quản lý Offers</Heading>

        <VStack align="stretch" gap={6}>
          <Box bg="white" border="1px" borderColor="gray.200" borderRadius="xl" p={5}>
            <Heading size="md" mb={4}>Offers nhận được</Heading>

            {receivedOffersQuery.isLoading ? (
              <Flex justify="center" py={4}><Spinner size="md" /></Flex>
            ) : receivedOffersQuery.data && receivedOffersQuery.data.length > 0 ? (
              <VStack align="stretch" gap={3}>
                {receivedOffersQuery.data.map((offer) => {
                  const status = OFFER_STATUS_META[offer.status] ?? { label: offer.status, color: "gray" }
                  return (
                    <Box key={offer.id} border="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                      <Flex justify="space-between" align={{ base: "start", md: "center" }} gap={3}>
                        <Box>
                          <Text fontWeight="semibold">{formatCurrencyVnd(Math.floor(Number(offer.offer_price)))}</Text>
                          <Text fontSize="sm" color="gray.500">
                            Listing: {offer.listing_id.slice(0, 8)}... · Buyer: {offer.buyer_id.slice(0, 8)}...
                          </Text>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {new Date(offer.created_at).toLocaleString("vi-VN")}
                          </Text>
                        </Box>

                        <VStack align="end" gap={2}>
                          <Badge colorPalette={status.color as any}>{status.label}</Badge>
                          <HStack>
                            {offer.status === "pending" && (
                              <>
                                <Button
                                  size="xs"
                                  colorPalette="green"
                                  onClick={() =>
                                    updateOfferMutation.mutate({
                                      offerId: offer.id,
                                      data: { status: "accepted" },
                                    })
                                  }
                                  loading={updateOfferMutation.isPending}
                                >
                                  Accept
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  colorPalette="red"
                                  onClick={() =>
                                    updateOfferMutation.mutate({
                                      offerId: offer.id,
                                      data: { status: "rejected" },
                                    })
                                  }
                                  loading={updateOfferMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                navigate({
                                  to: "/listings/$id",
                                  params: { id: offer.listing_id },
                                  search: { offerId: offer.id } as any,
                                })
                              }
                            >
                              Chi tiết
                            </Button>
                          </HStack>
                        </VStack>
                      </Flex>
                    </Box>
                  )
                })}
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500">Bạn chưa nhận được offer nào.</Text>
            )}
          </Box>

          <Box bg="white" border="1px" borderColor="gray.200" borderRadius="xl" p={5}>
            <Heading size="md" mb={4}>Offers đã gửi</Heading>

            {sentOffersQuery.isLoading ? (
              <Flex justify="center" py={4}><Spinner size="md" /></Flex>
            ) : sentOffersQuery.data && sentOffersQuery.data.length > 0 ? (
              <VStack align="stretch" gap={3}>
                {sentOffersQuery.data.map((offer) => {
                  const status = OFFER_STATUS_META[offer.status] ?? { label: offer.status, color: "gray" }
                  return (
                    <Box key={offer.id} border="1px" borderColor="gray.200" borderRadius="lg" p={4}>
                      <Flex justify="space-between" align={{ base: "start", md: "center" }} gap={3}>
                        <Box>
                          <Text fontWeight="semibold">{formatCurrencyVnd(Math.floor(Number(offer.offer_price)))}</Text>
                          <Text fontSize="sm" color="gray.500">Listing: {offer.listing_id.slice(0, 8)}...</Text>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {new Date(offer.created_at).toLocaleString("vi-VN")}
                          </Text>
                        </Box>
                        <Badge colorPalette={status.color as any}>{status.label}</Badge>
                      </Flex>
                    </Box>
                  )
                })}
              </VStack>
            ) : (
              <Text fontSize="sm" color="gray.500">Bạn chưa gửi offer nào.</Text>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}
