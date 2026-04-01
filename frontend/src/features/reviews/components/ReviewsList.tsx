import { Box, Flex, Link as ChakraLink, Spinner, Text, VStack } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import type { ReviewRead } from "@/client"
import { RatingStars } from "@/features/reviews/components/RatingStars"
import { getUserPublicProfile } from "@/features/users/api/users.api"

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
  const reviewerIds = Array.from(
    new Set(reviews.map((review) => review.reviewer_id)),
  ).sort()

  const reviewerProfilesQuery = useQuery({
    queryKey: ["reviewer-profiles", reviewerIds],
    queryFn: async () => {
      const entries = await Promise.all(
        reviewerIds.map(async (reviewerId) => {
          try {
            const profile = await getUserPublicProfile(reviewerId)
            return [reviewerId, profile] as const
          } catch {
            return [reviewerId, null] as const
          }
        }),
      )

      return new Map(
        entries.filter(
          (
            entry,
          ): entry is [
            string,
            NonNullable<Awaited<ReturnType<typeof getUserPublicProfile>>>,
          ] => entry[1] !== null,
        ),
      )
    },
    enabled: reviewerIds.length > 0,
    staleTime: 60_000,
  })

  const getReviewerName = (reviewerId: string) => {
    const profile = reviewerProfilesQuery.data?.get(reviewerId)
    if (profile?.full_name?.trim()) {
      return profile.full_name.trim()
    }
    return `${reviewerId.slice(0, 8)}...`
  }

  if (isLoading) {
    return (
      <Flex justify="center" py={6}>
        <Spinner size="md" color="blue.500" />
      </Flex>
    )
  }

  if (reviews.length === 0) {
    return (
      <Box
        border="1px"
        borderColor="gray.200"
        borderRadius="lg"
        p={4}
        bg="white"
      >
        <Text fontSize="sm" color="gray.500">
          {emptyText}
        </Text>
      </Box>
    )
  }

  return (
    <VStack gap={3} align="stretch">
      {reviews.map((review) => (
        <Box
          key={review.id}
          border="1px"
          borderColor="gray.200"
          borderRadius="lg"
          p={4}
          bg="white"
        >
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            gap={2}
          >
            <ChakraLink asChild>
              <Link to="/sellers/$id" params={{ id: review.reviewer_id }}>
                <Text
                  fontSize="sm"
                  color="blue.600"
                  fontWeight="medium"
                  textDecoration="underline"
                >
                  Reviewer: {getReviewerName(review.reviewer_id)}
                </Text>
              </Link>
            </ChakraLink>
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
