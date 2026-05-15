import {
  Badge,
  Box,
  Dialog,
  Flex,
  Icon,
  Image,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react"
import { FiAlertTriangle, FiCalendar, FiPackage, FiTag, FiX } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import { useListingDetails } from "@/features/listings/hooks/useMyListings"

interface RejectedListingDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listingId: string | null
  reasonReject?: string
}

const CONDITION_LABELS: Record<string, string> = {
  brand_new: "Mới",
  like_new: "Như mới",
  good: "Tốt",
  fair: "Khá",
  poor: "Cũ",
}

const CONDITION_COLORS: Record<string, string> = {
  brand_new: "green",
  like_new: "blue",
  good: "teal",
  fair: "orange",
  poor: "gray",
}

export function RejectedListingDetailModal({
  open,
  onOpenChange,
  listingId,
  reasonReject,
}: RejectedListingDetailModalProps) {
  const { data: listing, isLoading } = useListingDetails(listingId ?? "")

  const primaryImage = listing?.images?.find((img) => img.is_primary)
  const imageUrl =
    (primaryImage as any)?.thumbnail_url ??
    (primaryImage as any)?.image_url ??
    primaryImage?.image_url ??
    null

  const formatPrice = (price: string) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(parseInt(price, 10))

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.700" backdropFilter="blur(8px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="560px"
            w="full"
            borderRadius="2xl"
            p={0}
            overflow="hidden"
            boxShadow="0 40px 100px rgba(0,0,0,0.22)"
            border="1px solid"
            borderColor="gray.100"
          >
            {/* Header */}
            <Flex
              align="center"
              justify="space-between"
              px={6}
              py={4}
              borderBottom="1px solid"
              borderColor="gray.100"
              bg="white"
            >
              <Text fontWeight="800" fontSize="lg" color="gray.900" letterSpacing="-0.02em">
                Chi tiết tin đăng
              </Text>
              <Button
                variant="ghost"
                size="sm"
                borderRadius="lg"
                onClick={() => onOpenChange(false)}
                color="gray.400"
                _hover={{ bg: "gray.100", color: "gray.700" }}
                px={2}
              >
                <Icon as={FiX} w={5} h={5} />
              </Button>
            </Flex>

            {/* Body */}
            <Box overflowY="auto" maxH="calc(100vh - 200px)">
              {isLoading ? (
                <Flex justify="center" align="center" py={16}>
                  <Spinner size="lg" color="blue.500" />
                </Flex>
              ) : !listing ? (
                <Flex justify="center" align="center" py={16}>
                  <Text color="gray.400" fontSize="sm">
                    Không tìm thấy thông tin tin đăng.
                  </Text>
                </Flex>
              ) : (
                <VStack align="stretch" gap={0}>
                  {/* Lý do từ chối — banner đỏ nhạt dashed */}
                  <Box
                    mx={6}
                    mt={5}
                    mb={0}
                    p={4}
                    bg="red.50"
                    border="2px dashed"
                    borderColor="red.400"
                    borderRadius="xl"
                  >
                    <Flex align="flex-start" gap={3}>
                      <Flex
                        w={9}
                        h={9}
                        align="center"
                        justify="center"
                        borderRadius="lg"
                        bg="red.100"
                        flexShrink={0}
                        mt={0.5}
                      >
                        <Icon as={FiAlertTriangle} w={5} h={5} color="red.600" />
                      </Flex>
                      <Box>
                        <Text
                          fontWeight="700"
                          fontSize="sm"
                          color="red.700"
                          mb={1}
                          letterSpacing="-0.01em"
                        >
                          Tin đăng bị từ chối
                        </Text>
                        {reasonReject ? (
                          <Text fontSize="sm" color="red.600" lineHeight="1.6">
                            {reasonReject}
                          </Text>
                        ) : (
                          <Text fontSize="sm" color="red.400" fontStyle="italic">
                            Admin không để lại lý do cụ thể.
                          </Text>
                        )}
                        <Text fontSize="xs" color="red.400" mt={2}>
                          Tin đăng sẽ tự động xóa sau 15 ngày kể từ khi bị từ chối.
                        </Text>
                      </Box>
                    </Flex>
                  </Box>

                  {/* Listing content */}
                  <Box px={6} pt={5} pb={6}>
                    {/* Image + basic info */}
                    <Flex gap={4} mb={5}>
                      {imageUrl ? (
                        <Box
                          w="100px"
                          h="100px"
                          borderRadius="xl"
                          overflow="hidden"
                          flexShrink={0}
                          border="1px solid"
                          borderColor="gray.100"
                          boxShadow="0 2px 12px rgba(0,0,0,0.06)"
                        >
                          <Image
                            src={imageUrl}
                            alt={listing.title}
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        </Box>
                      ) : (
                        <Flex
                          w="100px"
                          h="100px"
                          borderRadius="xl"
                          bg="gray.100"
                          align="center"
                          justify="center"
                          flexShrink={0}
                          border="1px solid"
                          borderColor="gray.200"
                        >
                          <Icon as={FiPackage} w={8} h={8} color="gray.400" />
                        </Flex>
                      )}

                      <Box flex={1} minW={0}>
                        <Text
                          fontWeight="800"
                          fontSize="md"
                          color="gray.900"
                          lineHeight="1.4"
                          mb={2}
                          letterSpacing="-0.01em"
                        >
                          {listing.title}
                        </Text>
                        <Flex align="center" gap={2} mb={2} flexWrap="wrap">
                          <Badge
                            colorPalette={CONDITION_COLORS[listing.condition_grade] ?? "gray"}
                            variant="subtle"
                            borderRadius="full"
                            px={3}
                            fontSize="xs"
                          >
                            {CONDITION_LABELS[listing.condition_grade] ?? listing.condition_grade}
                          </Badge>
                          <Badge
                            colorPalette="red"
                            variant="subtle"
                            borderRadius="full"
                            px={3}
                            fontSize="xs"
                          >
                            Bị từ chối
                          </Badge>
                        </Flex>
                        <Flex align="center" gap={1}>
                          <Icon as={FiTag} w={4} h={4} color="blue.500" />
                          <Text
                            fontWeight="800"
                            fontSize="lg"
                            color="blue.600"
                            letterSpacing="-0.02em"
                          >
                            {formatPrice(listing.price)}
                          </Text>
                        </Flex>
                      </Box>
                    </Flex>

                    {/* Description */}
                    {listing.description && (
                      <Box
                        bg="gray.50"
                        borderRadius="xl"
                        p={4}
                        mb={4}
                        border="1px solid"
                        borderColor="gray.100"
                      >
                        <Text
                          fontSize="xs"
                          fontWeight="700"
                          color="gray.400"
                          textTransform="uppercase"
                          letterSpacing="0.06em"
                          mb={2}
                        >
                          Mô tả
                        </Text>
                        <Text
                          fontSize="sm"
                          color="gray.700"
                          lineHeight="1.7"
                          whiteSpace="pre-wrap"
                        >
                          {listing.description}
                        </Text>
                      </Box>
                    )}

                    {/* Meta */}
                    <Flex
                      gap={3}
                      flexWrap="wrap"
                      align="center"
                      color="gray.400"
                      fontSize="xs"
                    >
                      <Flex align="center" gap={1.5}>
                        <Icon as={FiCalendar} w={3.5} h={3.5} />
                        <Text>
                          Đăng ngày{" "}
                          {new Date(listing.created_at).toLocaleDateString("vi-VN")}
                        </Text>
                      </Flex>
                    </Flex>
                  </Box>
                </VStack>
              )}
            </Box>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
