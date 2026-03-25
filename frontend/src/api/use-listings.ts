import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import {
  listingsGetAll,
  listingsGetById,
  listingsGetMy,
  listingsCreate,
  listingsUpdate,
  listingsDelete,
} from "@/client"
import type { Listing, ListingCard, PaginatedResponse } from "@/types"

// Query Keys
export const listingKeys = {
  all: ["listings"] as const,
  lists: () => [...listingKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...listingKeys.lists(), filters] as const,
  details: () => [...listingKeys.all, "detail"] as const,
  detail: (id: string) => [...listingKeys.details(), id] as const,
  my: () => [...listingKeys.all, "my"] as const,
}

// Types
interface ListingsFilters {
  page?: number
  size?: number
  keyword?: string
  category_id?: string
  condition_grade?: string
  price_min?: number
  price_max?: number
  province?: string
  sort_by?: string
  sort_order?: "asc" | "desc"
}

/**
 * useListings - Get paginated listings with filters
 */
export function useListings(filters: ListingsFilters = {}) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: listingKeys.list(filters),
    queryFn: async () => {
      const response = await listingsGetAll({
        query: {
          page: filters.page || 1,
          size: filters.size || 20,
          keyword: filters.keyword,
          category_id: filters.category_id,
          condition_grade: filters.condition_grade,
          price_min: filters.price_min,
          price_max: filters.price_max,
          province: filters.province,
          sort_by: filters.sort_by,
          sort_order: filters.sort_order,
        },
      })
      return response.data as PaginatedResponse<ListingCard>
    },
    placeholderData: (previousData) => previousData,
  })
}

/**
 * useInfiniteListings - Infinite scroll listings
 */
export function useInfiniteListings(filters: Omit<ListingsFilters, "page"> = {}) {
  return useInfiniteQuery({
    queryKey: listingKeys.list({ ...filters, infinite: true }),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await listingsGetAll({
        query: {
          page: pageParam,
          size: filters.size || 20,
          keyword: filters.keyword,
          category_id: filters.category_id,
          condition_grade: filters.condition_grade,
          price_min: filters.price_min,
          price_max: filters.price_max,
          province: filters.province,
          sort_by: filters.sort_by,
          sort_order: filters.sort_order,
        },
      })
      return response.data as PaginatedResponse<ListingCard>
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.pages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })
}

/**
 * useListing - Get single listing by ID
 */
export function useListing(id: string) {
  return useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: async () => {
      const response = await listingsGetById({ path: { id } })
      return response.data as Listing
    },
    enabled: !!id,
  })
}

/**
 * useMyListings - Get current user's listings
 */
export function useMyListings(filters: Omit<ListingsFilters, "keyword"> = {}) {
  return useQuery({
    queryKey: listingKeys.my(),
    queryFn: async () => {
      const response = await listingsGetMy({
        query: {
          page: filters.page || 1,
          size: filters.size || 20,
        },
      })
      return response.data as PaginatedResponse<ListingCard>
    },
  })
}

/**
 * useCreateListing - Create new listing
 */
export function useCreateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await listingsCreate({
        body: data as any,
      })
      return response.data as Listing
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.my() })
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() })
    },
  })
}

/**
 * useUpdateListing - Update existing listing
 */
export function useUpdateListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Listing> }) => {
      const response = await listingsUpdate({
        path: { id },
        body: data as any,
      })
      return response.data as Listing
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(listingKeys.detail(variables.id), data)
      queryClient.invalidateQueries({ queryKey: listingKeys.my() })
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() })
    },
  })
}

/**
 * useDeleteListing - Delete listing
 */
export function useDeleteListing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await listingsDelete({ path: { id } })
      return id
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: listingKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: listingKeys.my() })
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() })
    },
  })
}
