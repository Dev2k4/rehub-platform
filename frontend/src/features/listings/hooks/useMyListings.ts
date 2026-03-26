import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getMyListings,
  createListing,
  updateListing,
  deleteListing,
  getListingDetails,
  uploadListingImage,
  deleteListingImage,
  type CreateListingInput,
  type UpdateListingInput,
} from "@/features/listings/api/listings.api"
import type { ListingWithImages, ListingPaginated } from "@/client"

export function useMyListings(params?: {
  keyword?: string
  status?: string
  skip?: number
  limit?: number
}) {
  return useQuery<ListingPaginated>({
    queryKey: ["listings", "my-listings", params],
    queryFn: () => getMyListings(params),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateListingInput) => createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", "my-listings"] })
    },
  })
}

export function useUpdateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      listingId,
      data,
    }: {
      listingId: string
      data: UpdateListingInput
    }) => updateListing(listingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", "my-listings"] })
    },
  })
}

export function useDeleteListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (listingId: string) => deleteListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings", "my-listings"] })
    },
  })
}

export function useListingDetails(listingId: string) {
  return useQuery<ListingWithImages>({
    queryKey: ["listings", listingId],
    queryFn: () => getListingDetails(listingId),
    enabled: !!listingId,
  })
}

export function useUploadListingImage() {
  return useMutation({
    mutationFn: ({
      listingId,
      file,
      isPrimary,
    }: {
      listingId: string
      file: File
      isPrimary?: boolean
    }) => uploadListingImage(listingId, file, isPrimary),
  })
}

export function useDeleteListingImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (imageId: string) => deleteListingImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] })
    },
  })
}
