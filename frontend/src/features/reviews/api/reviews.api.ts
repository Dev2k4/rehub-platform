import { ReviewsService } from "@/client"
import type { ReviewCreate, ReviewRead } from "@/client"

export async function createReview(data: ReviewCreate): Promise<ReviewRead> {
  return ReviewsService.createReviewApiV1ReviewsPost({
    requestBody: data,
  })
}

export async function getUserReviews(userId: string): Promise<ReviewRead[]> {
  return ReviewsService.getUserReviewsApiV1ReviewsUserUserIdGet({ userId })
}

export async function getOrderReviews(orderId: string): Promise<ReviewRead[]> {
  const response = await ReviewsService.getReviewApiV1ReviewsOrderIdGet({ orderId })

  // Some generated clients typed this endpoint as a single ReviewRead while backend returns a list.
  if (Array.isArray(response)) {
    return response
  }

  return response ? [response as ReviewRead] : []
}
