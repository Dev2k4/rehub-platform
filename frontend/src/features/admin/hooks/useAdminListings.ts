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
    onSuccess: (listing) => {
      queryClient.setQueryData(["listings", listing.id], (old: any) => {
        if (!old) {
          return old
        }
        return {
          ...old,
          ...listing,
        }
      })
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] })
      queryClient.invalidateQueries({ queryKey: ["listings", "my-listings"] })
      queryClient.invalidateQueries({ queryKey: ["listings", "public"] })
    },
  })
}

export function useRejectListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (listingId: string) => rejectListing(listingId),
    onSuccess: (listing) => {
      queryClient.setQueryData(["listings", listing.id], (old: any) => {
        if (!old) {
          return old
        }
        return {
          ...old,
          ...listing,
        }
      })
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] })
      queryClient.invalidateQueries({ queryKey: ["listings", "my-listings"] })
      queryClient.invalidateQueries({ queryKey: ["listings", "public"] })
    },
  })
}
