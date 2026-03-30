import { useQuery } from "@tanstack/react-query"
import {
  getMyReceivedOffers,
  getMySentOffers,
  getOffersForListing,
} from "@/features/offers/api/offers.api"

export function useMySentOffers(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: ["offers", "me", "sent", params?.skip ?? 0, params?.limit ?? 20],
    queryFn: () => getMySentOffers(params),
  })
}

export function useMyReceivedOffers(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: ["offers", "me", "received", params?.skip ?? 0, params?.limit ?? 20],
    queryFn: () => getMyReceivedOffers(params),
  })
}

export function useOffersForListing(
  listingId: string,
  params?: { skip?: number; limit?: number },
) {
  return useQuery({
    queryKey: ["offers", "listing", listingId, params?.skip ?? 0, params?.limit ?? 20],
    queryFn: () => getOffersForListing(listingId, params),
    enabled: !!listingId,
  })
}
