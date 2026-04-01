import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import type { ReviewRead, UserMe, UserPublicProfile } from "@/client"
import { wsClient } from "./ws.client"

type ReviewCreatedPayload = {
  review?: ReviewRead
}

type RatingChangedPayload = {
  user_id?: string
  rating_avg?: number
  rating_count?: number
  profile?: UserPublicProfile
}

type ProfileUpdatedPayload = {
  user?: UserMe
}

export function useRealtimeProfiles(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const unsubscribeReview = wsClient.on("review:created", (data) => {
      const payload = data as ReviewCreatedPayload
      const incoming = payload.review
      if (!incoming) {
        return
      }

      queryClient.setQueryData<ReviewRead[]>(
        ["reviews", "order", incoming.order_id],
        (old) => {
          const current = old ?? []
          const dedup = current.filter((item) => item.id !== incoming.id)
          return [incoming, ...dedup]
        },
      )

      queryClient.setQueryData<ReviewRead[]>(
        ["reviews", "user", incoming.reviewee_id],
        (old) => {
          const current = old ?? []
          const dedup = current.filter((item) => item.id !== incoming.id)
          return [incoming, ...dedup]
        },
      )

      queryClient.invalidateQueries({
        queryKey: ["reviews", "order", incoming.order_id],
      })
      queryClient.invalidateQueries({
        queryKey: ["reviews", "user", incoming.reviewee_id],
      })
    })

    const unsubscribeRating = wsClient.on("user:rating_changed", (data) => {
      const payload = data as RatingChangedPayload
      if (!payload.user_id) {
        return
      }

      if (payload.profile) {
        queryClient.setQueryData<UserPublicProfile>(
          ["seller-profile", payload.user_id],
          payload.profile,
        )
      } else if (
        typeof payload.rating_avg === "number" &&
        typeof payload.rating_count === "number"
      ) {
        const nextAvg = payload.rating_avg
        const nextCount = payload.rating_count
        queryClient.setQueryData<UserPublicProfile>(
          ["seller-profile", payload.user_id],
          (old) => {
            if (!old) {
              return old
            }
            return {
              ...old,
              rating_avg: nextAvg,
              rating_count: nextCount,
            }
          },
        )
      }

      queryClient.invalidateQueries({
        queryKey: ["seller-profile", payload.user_id],
      })
    })

    const unsubscribeProfile = wsClient.on("user:profile_updated", (data) => {
      const payload = data as ProfileUpdatedPayload
      if (!payload.user) {
        return
      }

      queryClient.setQueryData<UserMe | null>(["auth", "user"], payload.user)
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] })
    })

    return () => {
      unsubscribeReview()
      unsubscribeRating()
      unsubscribeProfile()
    }
  }, [enabled, queryClient])
}
