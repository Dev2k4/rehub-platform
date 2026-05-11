import {
  Badge,
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Heading,
  HStack,
  Image,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FiArrowUp, FiArrowDown } from "react-icons/fi"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { ApiError } from "@/client"
import {
  formatCurrencyVnd,
  getListingImageUrl,
} from "@/features/home/utils/marketplace.utils"
import { getListingDetails } from "@/features/listings/api/listings.api"
import { getOffer } from "@/features/offers/api/offers.api"
import { useUpdateOfferMutation } from "@/features/offers/hooks/useUpdateOfferMutation"
import { CounterOfferModal } from "./CounterOfferModal"

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
      setError(
        getErrorMessage(err, "Không thể đồng ý offer. Vui lòng thử lại."),
      )
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
      setError(
        getErrorMessage(err, "Không thể từ chối offer. Vui lòng thử lại."),
      )
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
              borderRadius="xl"
              boxShadow="2xl"
              overflow="hidden"
            >
              <Dialog.Header
                p={5}
                bg="blue.50"
                borderBottomWidth="1px"
                borderColor="blue.100"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Dialog.Title fontSize="lg" fontWeight="bold" color="blue.800">
                  Chi tiết đề xuất giá
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" color="blue.800" _hover={{ bg: "blue.100" }} onClick={handleClose} />
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
                    <Flex gap={4} p={3} bg="gray.50" borderRadius="lg" border="1px" borderColor="gray.100">
                      {currentImage ? (
                        <Image
                          src={getListingImageUrl(currentImage.image_url)}
                          alt={listing.title}
                          w="80px"
                          h="80px"
                          objectFit="cover"
                          borderRadius="md"
                        />
                      ) : (
                        <Box w="80px" h="80px" bg="gray.200" borderRadius="md" />
                      )}
                      <VStack align="start" gap={1} flex={1} justify="center">
                        <Heading as="h3" size="sm" color="gray.900" lineClamp={2}>
                          {listing.title}
                        </Heading>
                        <Text color="gray.500" fontSize="xs">
                          Mã tin: {listing.id.slice(0, 8)}...
                        </Text>
                      </VStack>
                    </Flex>

                    {/* Price Comparison */}
                    <Box
                      bg="white"
                      borderRadius="xl"
                      border="1px"
                      borderColor="blue.100"
                      boxShadow="sm"
                      overflow="hidden"
                    >
                      <Flex bg="blue.50" p={3} borderBottom="1px" borderColor="blue.100" justify="space-between" align="center">
                         <Text fontSize="sm" fontWeight="semibold" color="blue.800">
                           Chi tiết mức giá
                         </Text>
                         <Badge
                          colorPalette={
                            offer.status === "pending"
                              ? "blue"
                              : offer.status === "accepted"
                                ? "green"
                                : offer.status === "rejected"
                                  ? "red"
                                  : "purple"
                          }
                          variant="solid"
                        >
                          {offer.status === "pending"
                            ? "Chờ phản hồi"
                            : offer.status === "accepted"
                              ? "Đã đồng ý"
                              : offer.status === "rejected"
                                ? "Đã từ chối"
                                : "Đề xuất ngược lại"}
                        </Badge>
                      </Flex>
                      <VStack gap={0} align="stretch" css={{ "& > *:not(:last-child)": { borderBottom: "1px solid", borderColor: "gray.100" } }}>
                        <Flex p={4} justify="space-between" align="center">
                          <Text fontSize="sm" color="gray.600">
                            Giá gốc
                          </Text>
                          <Text
                            fontSize="md"
                            fontWeight="bold"
                            color="gray.800"
                          >
                            {formatCurrencyVnd(parseInt(listing.price, 10))}
                          </Text>
                        </Flex>
                        
                        <Flex p={4} justify="space-between" align="center" bg="orange.50">
                          <Text fontSize="sm" color="orange.800" fontWeight="medium">
                            Giá đề xuất
                          </Text>
                          <Text
                            fontSize="xl"
                            fontWeight="black"
                            color="orange.600"
                          >
                            {formatCurrencyVnd(
                              Math.floor(Number(offer.offer_price)),
                            )}
                          </Text>
                        </Flex>

                        <Flex p={4} justify="space-between" align="center">
                          <Text fontSize="sm" color="gray.600">
                            Chênh lệch
                          </Text>
                          <HStack gap={2}>
                            <Text fontSize="sm" fontWeight="semibold" color={Math.floor(Number(offer.offer_price)) < parseInt(listing.price, 10) ? "orange.600" : "green.600"}>
                              {formatCurrencyVnd(
                                Math.abs(
                                  Math.floor(Number(offer.offer_price)) -
                                    parseInt(listing.price, 10),
                                ),
                              )}
                            </Text>
                            <Badge
                              colorPalette={
                                Math.floor(Number(offer.offer_price)) <
                                parseInt(listing.price, 10)
                                  ? "orange"
                                  : "green"
                              }
                              variant="subtle"
                            >
                              <HStack gap={1}>
                                {Math.floor(Number(offer.offer_price)) < parseInt(listing.price, 10) ? <FiArrowDown /> : <FiArrowUp />}
                                <Text>
                                  {Math.floor(
                                    (Math.abs(Math.floor(Number(offer.offer_price)) -
                                      parseInt(listing.price, 10)) /
                                      parseInt(listing.price, 10)) *
                                      100,
                                  )}
                                  %
                                </Text>
                              </HStack>
                            </Badge>
                          </HStack>
                        </Flex>
                      </VStack>
                    </Box>
                  </VStack>
                )}
              </Dialog.Body>

              {/* Action Buttons */}
              {!offerQuery.isLoading && offer && (
                <Dialog.Footer
                  p={5}
                  bg="gray.50"
                  borderTopWidth="1px"
                  borderColor="gray.100"
                  display="flex"
                  gap={3}
                  justifyContent="flex-end"
                >
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isProcessing}
                    color="gray.600"
                  >
                    Đóng
                  </Button>

                  {offer.status === "pending" && (
                    <>
                      <Button
                        colorPalette="red"
                        variant="outline"
                        onClick={handleReject}
                        loading={isProcessing}
                        loadingText="Đang xử lý..."
                      >
                        Từ chối
                      </Button>
                      <Button
                        colorPalette="purple"
                        variant="outline"
                        onClick={handleCounterClick}
                        disabled={isProcessing}
                      >
                        Đề xuất ngược lại
                      </Button>
                      <Button
                        colorPalette="green"
                        onClick={handleAccept}
                        loading={isProcessing}
                        loadingText="Đang xử lý..."
                        boxShadow="md"
                      >
                        Đồng ý bán
                      </Button>
                    </>
                  )}

                  {offer.status === "countered" && (
                    <>
                      <Button
                        colorPalette="red"
                        variant="outline"
                        onClick={handleReject}
                        loading={isProcessing}
                        loadingText="Đang xử lý..."
                      >
                        Từ chối
                      </Button>
                      <Button
                        colorPalette="green"
                        onClick={handleAccept}
                        loading={isProcessing}
                        loadingText="Đang xử lý..."
                        boxShadow="md"
                      >
                        Đồng ý mua
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
          originalPrice={parseInt(listing.price, 10)}
          onSuccess={handleCounterSuccess}
        />
      )}
    </>
  )
}
