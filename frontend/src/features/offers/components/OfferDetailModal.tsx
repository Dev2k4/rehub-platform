import { useState } from "react"
import {
  Dialog,
  Portal,
  CloseButton,
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Spinner,
  Image,
  Badge,
  Flex,
} from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { ApiError } from "@/client"
import { getOffer } from "@/features/offers/api/offers.api"
import { getListingDetails } from "@/features/listings/api/listings.api"
import {
  formatCurrencyVnd,
  getListingImageUrl,
} from "@/features/home/utils/marketplace.utils"
import { CounterOfferModal } from "./CounterOfferModal"
import { useUpdateOfferMutation } from "@/features/offers/hooks/useUpdateOfferMutation"

type OfferDetailModalProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  offerId?: string
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const detail = (error.body as { detail?: unknown })?.detail
    if (typeof detail === "string" && detail.trim()) {
      return detail
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export function OfferDetailModal({
  isOpen,
  onOpenChange,
  offerId,
}: OfferDetailModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const offerQuery = useQuery({
    queryKey: ["offer", offerId],
    queryFn: () => getOffer(offerId!),
    enabled: !!offerId && isOpen,
  })

  const listingId = offerQuery.data?.listing_id
  const listingQuery = useQuery({
    queryKey: ["listing", listingId],
    queryFn: () => getListingDetails(listingId!),
    enabled: !!listingId,
  })

  const updateOfferMutation = useUpdateOfferMutation()

  const handleClose = () => {
    setError(null)
    onOpenChange(false)
  }

  const handleAccept = async () => {
    if (!offerId) return

    setError(null)
    setIsProcessing(true)

    try {
      await updateOfferMutation.mutateAsync({
        offerId,
        data: { status: "accepted" },
      })
      handleClose()
    } catch (err) {
      setError(getErrorMessage(err, "Không thể đồng ý offer. Vui lòng thử lại."))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!offerId) return

    setError(null)
    setIsProcessing(true)

    try {
      await updateOfferMutation.mutateAsync({
        offerId,
        data: { status: "rejected" },
      })
      handleClose()
    } catch (err) {
      setError(getErrorMessage(err, "Không thể từ chối offer. Vui lòng thử lại."))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCounterClick = () => {
    setIsCounterModalOpen(true)
  }

  const handleCounterClose = () => {
    setIsCounterModalOpen(false)
  }

  const handleCounterSuccess = () => {
    setIsCounterModalOpen(false)
    handleClose()
  }

  if (!isOpen || !offerId) {
    return null
  }

  const offer = offerQuery.data
  const listing = listingQuery.data
  const currentImage = listing?.images?.[0]

  return (
    <>
      <Dialog.Root
        open={isOpen}
        onOpenChange={(e) => onOpenChange(e.open)}
        size="md"
        placement="center"
        motionPreset="slide-in-bottom"
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content
              maxW="500px"
              bg="white"
              borderRadius="lg"
              boxShadow="xl"
            >
              <Dialog.Header
                p={6}
                borderBottomWidth="1px"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Dialog.Title fontSize="lg" fontWeight="semibold">
                  Chi tiết đề xuất giá
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" onClick={handleClose} />
                </Dialog.CloseTrigger>
              </Dialog.Header>

              <Dialog.Body p={6} maxH="70vh" overflowY="auto">
                {offerQuery.isLoading || listingQuery.isLoading ? (
                  <Flex justify="center" align="center" minH="300px">
                    <Spinner size="lg" color="blue.500" />
                  </Flex>
                ) : !offer || !listing ? (
                  <Box textAlign="center" py={8}>
                    <Text color="red.500" fontWeight="semibold">
                      Không tìm thấy thông tin
                    </Text>
                  </Box>
                ) : (
                  <VStack gap={6} align="stretch">
                    {/* Error Message */}
                    {error && (
                      <Box
                        bg="red.50"
                        border="1px"
                        borderColor="red.200"
                        borderRadius="md"
                        p={3}
                      >
                        <Text fontSize="sm" color="red.700">
                          {error}
                        </Text>
                      </Box>
                    )}

                    {/* Listing Info */}
                    <Box>
                      {currentImage && (
                        <Image
                          src={getListingImageUrl(currentImage.image_url)}
                          alt={listing.title}
                          w="full"
                          h="auto"
                          maxH="200px"
                          objectFit="cover"
                          borderRadius="md"
                          mb={3}
                        />
                      )}
                      <Heading as="h3" size="md" mb={2}>
                        {listing.title}
                      </Heading>
                      <Text color="gray.600" fontSize="sm">
                        Bộ sưu tập: {listing.category_id}
                      </Text>
                    </Box>

                    {/* Price Comparison */}
                    <Box
                      bg="gray.50"
                      p={4}
                      borderRadius="md"
                      borderLeft="4px"
                      borderColor="blue.500"
                    >
                      <VStack gap={3} align="start">
                        <Box w="full">
                          <Text fontSize="xs" color="gray.600" mb={1}>
                            Giá gốc
                          </Text>
                          <Text fontSize="lg" fontWeight="bold" color="gray.700">
                            {formatCurrencyVnd(parseInt(listing.price))}
                          </Text>
                        </Box>
                        <Box w="full" borderTopWidth="1px" pt={2}>
                          <Text fontSize="xs" color="gray.600" mb={1}>
                            Giá đề xuất
                          </Text>
                          <Text fontSize="xl" fontWeight="bold" color="blue.600">
                            {formatCurrencyVnd(Math.floor(Number(offer.offer_price)))}
                          </Text>
                        </Box>
                        <Box w="full" borderTopWidth="1px" pt={2}>
                          <Text fontSize="xs" color="gray.600" mb={1}>
                            Chênh lệch
                          </Text>
                          <Flex justify="space-between" align="center">
                            <Text fontSize="sm" fontWeight="semibold">
                              {Math.floor(Number(offer.offer_price)) < parseInt(listing.price)
                                ? "Giảm "
                                : "Tăng "}
                              {formatCurrencyVnd(
                                Math.abs(
                                  Math.floor(Number(offer.offer_price)) -
                                    parseInt(listing.price),
                                ),
                              )}
                            </Text>
                            <Badge
                              colorScheme={
                                Math.floor(Number(offer.offer_price)) < parseInt(listing.price)
                                  ? "orange"
                                  : "green"
                              }
                            >
                              {Math.floor(
                                ((Math.floor(Number(offer.offer_price)) -
                                  parseInt(listing.price)) /
                                  parseInt(listing.price)) *
                                  100,
                              )}
                              %
                            </Badge>
                          </Flex>
                        </Box>
                      </VStack>
                    </Box>

                    {/* Offer Status */}
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={2}>
                        Trạng thái
                      </Text>
                      <Badge
                        colorScheme={
                          offer.status === "pending"
                            ? "blue"
                            : offer.status === "accepted"
                              ? "green"
                              : offer.status === "rejected"
                                ? "red"
                                : "purple"
                        }
                      >
                        {offer.status === "pending"
                          ? "Chờ phản hồi"
                          : offer.status === "accepted"
                            ? "Đã đồng ý"
                            : offer.status === "rejected"
                              ? "Đã từ chối"
                              : "Đề xuất ngược lại"}
                      </Badge>
                    </Box>
                  </VStack>
                )}
              </Dialog.Body>

              {/* Action Buttons */}
              {!offerQuery.isLoading && offer && (
                <Dialog.Footer
                  p={6}
                  borderTopWidth="1px"
                  display="flex"
                  gap={3}
                  justifyContent="flex-end"
                >
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isProcessing}
                  >
                    Đóng
                  </Button>

                  {offer.status === "pending" && (
                    <>
                      <Button
                        colorScheme="red"
                        onClick={handleReject}
                        loading={isProcessing}
                        loadingText="Đang xử lý..."
                      >
                        Từ chối
                      </Button>
                      <Button
                        colorScheme="purple"
                        onClick={handleCounterClick}
                        disabled={isProcessing}
                      >
                        Đề xuất giá
                      </Button>
                      <Button
                        colorScheme="green"
                        onClick={handleAccept}
                        loading={isProcessing}
                        loadingText="Đang xử lý..."
                      >
                        Đồng ý
                      </Button>
                    </>
                  )}

                  {offer.status === "countered" && (
                    <>
                      <Button
                        colorScheme="red"
                        onClick={handleReject}
                        loading={isProcessing}
                        loadingText="Đang xử lý..."
                      >
                        Từ chối
                      </Button>
                      <Button
                        colorScheme="green"
                        onClick={handleAccept}
                        loading={isProcessing}
                        loadingText="Đang xử lý..."
                      >
                        Đồng ý
                      </Button>
                    </>
                  )}
                </Dialog.Footer>
              )}
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Counter Offer Modal */}
      {offer && listing && (
        <CounterOfferModal
          isOpen={isCounterModalOpen}
          onOpenChange={handleCounterClose}
          offerId={offerId}
          currentOfferPrice={Math.floor(Number(offer.offer_price))}
          originalPrice={parseInt(listing.price)}
          onSuccess={handleCounterSuccess}
        />
      )}
    </>
  )
}
