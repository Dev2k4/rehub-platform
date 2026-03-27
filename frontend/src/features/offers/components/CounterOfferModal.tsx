import { useState } from "react"
import {
  Dialog,
  Portal,
  CloseButton,
  Box,
  Button,
  Text,
  VStack,
  Input,
  Flex,
} from "@chakra-ui/react"
import { ApiError } from "@/client"
import { formatCurrencyVnd } from "@/features/home/utils/marketplace.utils"
import { useUpdateOfferMutation } from "@/features/offers/hooks/useUpdateOfferMutation"

type CounterOfferModalProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  offerId: string
  currentOfferPrice: number
  originalPrice: number
  onSuccess?: () => void
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

export function CounterOfferModal({
  isOpen,
  onOpenChange,
  offerId,
  currentOfferPrice,
  originalPrice,
  onSuccess,
}: CounterOfferModalProps) {
  const [counterPrice, setCounterPrice] = useState(
    Math.floor(originalPrice * 0.95),
  )
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const updateOfferMutation = useUpdateOfferMutation()

  const handleClose = () => {
    setError(null)
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    setError(null)

    const parsedPrice = Number(counterPrice)
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setError("Giá phải là số lớn hơn 0.")
      return
    }

    setIsProcessing(true)

    try {
      await updateOfferMutation.mutateAsync({
        offerId,
        data: {
          status: "countered",
          offer_price: parsedPrice,
        },
      })
      onSuccess?.()
      handleClose()
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Không thể cập nhật đề xuất giá. Vui lòng thử lại.",
        ),
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const pricePercentChange = (
    ((counterPrice - originalPrice) / originalPrice) *
    100
  ).toFixed(1)
  const priceDifference = counterPrice - originalPrice

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => onOpenChange(e.open)}
      size="sm"
      placement="center"
      motionPreset="slide-in-bottom"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content maxW="400px" bg="white" borderRadius="lg">
            <Dialog.Header
              p={4}
              borderBottomWidth="1px"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Dialog.Title fontSize="md" fontWeight="semibold">
                Đề xuất giá ngược lại
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" onClick={handleClose} />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body p={6}>
              <VStack gap={4} align="stretch">
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

                {/* Original Price Info */}
                <Box
                  bg="gray.50"
                  p={3}
                  borderRadius="md"
                  borderLeft="3px"
                  borderColor="gray.300"
                >
                  <Text fontSize="xs" color="gray.600" mb={1}>
                    Giá gốc
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="gray.700">
                    {formatCurrencyVnd(originalPrice)}
                  </Text>
                </Box>

                {/* Counter Price Input */}
                <Box>
                  <Text fontSize="sm" fontWeight="semibold" mb={2}>
                    Giá đề xuất của bạn
                  </Text>
                  <Input
                    type="number"
                    value={counterPrice}
                    onChange={(e) => {
                      setError(null)
                      setCounterPrice(Number(e.target.value))
                    }}
                    placeholder="Nhập giá đề xuất"
                    disabled={isProcessing}
                    bg="white"
                  />
                  {error && (
                    <Text fontSize="xs" color="red.600" mt={1}>
                      {error}
                    </Text>
                  )}
                </Box>

                {/* Price Summary */}
                <Box
                  bg="blue.50"
                  p={3}
                  borderRadius="md"
                  borderLeft="3px"
                  borderColor="blue.400"
                >
                  <Flex justify="space-between" mb={2}>
                    <Text fontSize="xs" color="blue.700">
                      Đề xuất của bạn
                    </Text>
                    <Text fontSize="sm" fontWeight="bold" color="blue.900">
                      {formatCurrencyVnd(Math.floor(counterPrice))}
                    </Text>
                  </Flex>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" color="blue.700">
                      {priceDifference >= 0 ? "Tăng" : "Giảm"}
                    </Text>
                    <Flex
                      gap={2}
                      align="center"
                      color={priceDifference >= 0 ? "green.600" : "orange.600"}
                    >
                      <Text fontSize="sm" fontWeight="bold">
                        {priceDifference >= 0 ? "+" : "-"}
                        {formatCurrencyVnd(Math.abs(priceDifference))}
                      </Text>
                      <Text fontSize="xs" fontWeight="bold">
                        ({pricePercentChange}%)
                      </Text>
                    </Flex>
                  </Flex>
                </Box>

                {/* Current Offer Info */}
                <Box
                  bg="gray.50"
                  p={3}
                  borderRadius="md"
                  borderLeft="3px"
                  borderColor="gray.300"
                >
                  <Text fontSize="xs" color="gray.600" mb={1}>
                    Đề xuất hiện tại của người mua
                  </Text>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    {formatCurrencyVnd(currentOfferPrice)}
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer
              p={4}
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
                Hủy
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                loading={isProcessing}
                loadingText="Đang gửi..."
              >
                Gửi đề xuất
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
