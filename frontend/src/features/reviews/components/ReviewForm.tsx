import { Box, Text, Textarea, VStack } from "@chakra-ui/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/ui/field"
import { RatingStars } from "@/features/reviews/components/RatingStars"
import { useCreateReview } from "@/features/reviews/hooks/useReviews"

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
    <Box
      border="1px"
      borderColor="gray.200"
      borderRadius="xl"
      p={6}
      bg="white"
      boxShadow="0 2px 8px rgba(0,0,0,0.04)"
    >
      <VStack align="stretch" gap={4}>
        <Field label="Chấm điểm">
          <RatingStars value={rating} onChange={setRating} />
        </Field>

        <Field label="Nhận xét">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm của bạn (không bắt buộc)..."
            maxLength={500}
            resize="vertical"
            borderRadius="lg"
            borderColor="gray.200"
            px={4}
            py={3}
            _focus={{
              borderColor: "blue.400",
              ring: "1px",
              ringColor: "blue.400",
            }}
          />
        </Field>

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
          loadingText="Đang gửi..."
          borderRadius="xl"
          px={6}
          boxShadow="0 4px 12px rgba(66,153,225,0.3)"
        >
          Gửi đánh giá
        </Button>
      </VStack>
    </Box>
  )
}
