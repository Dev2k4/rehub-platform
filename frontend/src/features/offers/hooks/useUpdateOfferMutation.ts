import { useMutation } from "@tanstack/react-query"
import { updateOfferStatus } from "@/features/offers/api/offers.api"
import type { OfferStatusUpdate } from "@/client"

export function useUpdateOfferMutation() {
  return useMutation({
    mutationFn: ({
      offerId,
      data,
    }: {
      offerId: string
      data: OfferStatusUpdate
    }) => updateOfferStatus(offerId, data),
  })
}
