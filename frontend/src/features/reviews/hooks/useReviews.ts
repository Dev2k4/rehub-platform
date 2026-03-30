import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createReview, getOrderReviews, getUserReviews } from "@/features/reviews/api/reviews.api"
import type { ReviewCreate } from "@/client"

export function useOrderReviews(orderId: string) {
  return useQuery({
    queryKey: ["reviews", "order", orderId],
    queryFn: () => getOrderReviews(orderId),
    enabled: !!orderId,
    staleTime: 30 * 1000,
  })
}

export function useUserReviews(userId: string) {
  return useQuery({
    queryKey: ["reviews", "user", userId],
    queryFn: () => getUserReviews(userId),
    enabled: !!userId,
    staleTime: 60 * 1000,
  })
}

export function useCreateReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ReviewCreate) => createReview(data),
    onSuccess: (createdReview) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "order", createdReview.order_id],
      })
      queryClient.invalidateQueries({
        queryKey: ["reviews", "user", createdReview.reviewee_id],
      })
      queryClient.invalidateQueries({ queryKey: ["orders", createdReview.order_id] })
    },
  })
}
