import { useState } from "react"
import { Box, Button, Text, Textarea, VStack } from "@chakra-ui/react"
import { useCreateReview } from "@/features/reviews/hooks/useReviews"
import { RatingStars } from "@/features/reviews/components/RatingStars"

type ReviewFormProps = {
  orderId: string
  onSuccess?: () => void
}

export function ReviewForm({ orderId, onSuccess }: ReviewFormProps) {
  const createReviewMutation = useCreateReview()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  const handleSubmit = async () => {
    setFormError(null)

    if (rating < 1 || rating > 5) {
      setFormError("Vui lòng chọn số sao từ 1 đến 5.")
      return
    }

    try {
      await createReviewMutation.mutateAsync({
        order_id: orderId,
        rating,
        comment: comment.trim() ? comment.trim() : null,
      })
      setComment("")
      onSuccess?.()
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Không thể gửi đánh giá. Vui lòng thử lại."
      setFormError(message)
    }
  }

  return (
    <Box border="1px" borderColor="gray.200" borderRadius="lg" p={4} bg="white">
      <VStack align="stretch" gap={3}>
        <Text fontWeight="semibold" color="gray.900">
          Đánh giá giao dịch
        </Text>

        <RatingStars value={rating} onChange={setRating} />

        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)..."
          maxLength={500}
          resize="vertical"
        />

        {formError && (
          <Text fontSize="sm" color="red.600">
            {formError}
          </Text>
        )}

        <Button
          alignSelf="flex-start"
          colorPalette="blue"
          onClick={handleSubmit}
          loading={createReviewMutation.isPending}
        >
          Gửi đánh giá
        </Button>
      </VStack>
    </Box>
  )
}
