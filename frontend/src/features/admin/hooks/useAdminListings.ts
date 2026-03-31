import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ListingRead } from "@/client"
import {
  approveListing,
  getPendingListings,
  rejectListing,
} from "../api/admin.listings.api"

export function usePendingListings(params?: { skip?: number; limit?: number }) {
  return useQuery<ListingRead[]>({
    queryKey: ["admin", "listings", "pending", params],
    queryFn: () => getPendingListings(params),
    staleTime: 2 * 60 * 1000,
  })
}

export function useApproveListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (listingId: string) => approveListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] })
    },
  })
}

export function useRejectListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (listingId: string) => rejectListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] })
    },
  })
}
