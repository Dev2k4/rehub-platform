import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ReviewCreate } from "@/client"
import {
  createReview,
  getOrderReviews,
  getUserReviews,
} from "@/features/reviews/api/reviews.api"

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
      queryClient.setQueryData(
        ["reviews", "order", createdReview.order_id],
        (old: any) => {
          if (!Array.isArray(old)) {
            return old
          }
          const dedup = old.filter((item: any) => item.id !== createdReview.id)
          return [createdReview, ...dedup]
        },
      )
      queryClient.setQueryData(
        ["reviews", "user", createdReview.reviewee_id],
        (old: any) => {
          if (!Array.isArray(old)) {
            return old
          }
          const dedup = old.filter((item: any) => item.id !== createdReview.id)
          return [createdReview, ...dedup]
        },
      )
      queryClient.invalidateQueries({
        queryKey: ["reviews", "order", createdReview.order_id],
      })
      queryClient.invalidateQueries({
        queryKey: ["reviews", "user", createdReview.reviewee_id],
      })
      queryClient.invalidateQueries({
        queryKey: ["seller-profile", createdReview.reviewee_id],
      })
      queryClient.invalidateQueries({
        queryKey: ["orders", createdReview.order_id],
      })
    },
  })
}
