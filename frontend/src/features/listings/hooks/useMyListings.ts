import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { ListingPaginated, ListingWithImages } from "@/client"
import {
  type CreateListingInput,
  createListing,
  deleteListing,
  deleteListingImage,
  getListingDetails,
  getMyListings,
  type UpdateListingInput,
  updateListing,
  uploadListingImage,
} from "@/features/listings/api/listings.api"

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
    onSuccess: (created) => {
      queryClient.setQueryData<ListingWithImages>(["listings", created.id], (old) => {
        if (old) {
          return old
        }
        return {
          ...(created as unknown as ListingWithImages),
          images: [],
        }
      })
      queryClient.setQueriesData<ListingPaginated>({ queryKey: ["listings", "my-listings"] }, (old) => {
        if (!old) {
          return old
        }
        const exists = old.items.some((item) => item.id === created.id)
        if (exists) {
          return old
        }
        return {
          ...old,
          total: old.total + 1,
          items: [
            {
              ...(created as unknown as ListingWithImages),
              images: [],
            },
            ...old.items,
          ],
        }
      })
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
    onSuccess: (updated) => {
      queryClient.setQueryData<ListingWithImages>(["listings", updated.id], (old) => {
        if (!old) {
          return old
        }
        return {
          ...old,
          ...updated,
        }
      })
      queryClient.setQueriesData<ListingPaginated>({ queryKey: ["listings", "my-listings"] }, (old) => {
        if (!old) {
          return old
        }
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === updated.id
              ? {
                  ...item,
                  ...updated,
                }
              : item,
          ),
        }
      })
      queryClient.invalidateQueries({ queryKey: ["listings", "my-listings"] })
    },
  })
}

export function useDeleteListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (listingId: string) => deleteListing(listingId),
    onSuccess: (_, listingId) => {
      queryClient.removeQueries({ queryKey: ["listings", listingId] })
      queryClient.setQueriesData<ListingPaginated>({ queryKey: ["listings", "my-listings"] }, (old) => {
        if (!old) {
          return old
        }

        const nextItems = old.items.filter((item) => item.id !== listingId)
        if (nextItems.length === old.items.length) {
          return old
        }

        return {
          ...old,
          total: Math.max(0, old.total - 1),
          items: nextItems,
        }
      })
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
  const queryClient = useQueryClient()

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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listings", variables.listingId] })
      queryClient.invalidateQueries({ queryKey: ["listing", variables.listingId] })
      queryClient.invalidateQueries({ queryKey: ["listings", "my-listings"] })
    },
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
