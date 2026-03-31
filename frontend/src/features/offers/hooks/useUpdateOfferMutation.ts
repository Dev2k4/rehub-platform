import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { OfferStatusUpdate } from "@/client"
import { updateOfferStatus } from "@/features/offers/api/offers.api"

export function useUpdateOfferMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      offerId,
      data,
    }: {
      offerId: string
      data: OfferStatusUpdate
    }) => updateOfferStatus(offerId, data),
    onSuccess: (offer) => {
      queryClient.invalidateQueries({ queryKey: ["offer", offer.id] })
      queryClient.invalidateQueries({ queryKey: ["offers", "me", "sent"] })
      queryClient.invalidateQueries({ queryKey: ["offers", "me", "received"] })
      queryClient.invalidateQueries({
        queryKey: ["offers", "listing", offer.listing_id],
      })
    },
  })
}
