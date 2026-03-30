import { Box, Flex, Spinner, Text, VStack } from "@chakra-ui/react"
import type { ReviewRead } from "@/client"
import { RatingStars } from "@/features/reviews/components/RatingStars"

type ReviewsListProps = {
  reviews: ReviewRead[]
  isLoading?: boolean
  emptyText?: string
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString("vi-VN")
}

export function ReviewsList({
  reviews,
  isLoading = false,
  emptyText = "Chưa có đánh giá nào.",
}: ReviewsListProps) {
  if (isLoading) {
    return (
      <Flex justify="center" py={6}>
        <Spinner size="md" color="blue.500" />
      </Flex>
    )
  }

  if (reviews.length === 0) {
    return (
      <Box border="1px" borderColor="gray.200" borderRadius="lg" p={4} bg="white">
        <Text fontSize="sm" color="gray.500">
          {emptyText}
        </Text>
      </Box>
    )
  }

  return (
    <VStack gap={3} align="stretch">
      {reviews.map((review) => (
        <Box key={review.id} border="1px" borderColor="gray.200" borderRadius="lg" p={4} bg="white">
          <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={2}>
            <Text fontSize="sm" color="gray.700" fontWeight="medium">
              Reviewer: {review.reviewer_id.slice(0, 8)}...
            </Text>
            <Text fontSize="xs" color="gray.500">
              {formatDateTime(review.created_at)}
            </Text>
          </Flex>
          <Box mt={2}>
            <RatingStars value={review.rating} readOnly />
          </Box>
          {review.comment && (
            <Text mt={2} fontSize="sm" color="gray.700" whiteSpace="pre-wrap">
              {review.comment}
            </Text>
          )}
        </Box>
      ))}
    </VStack>
  )
}
