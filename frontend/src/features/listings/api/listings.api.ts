import type { ListingPaginated, ListingRead, ListingWithImages } from "@/client"
import { type ListingStatus, ListingsService } from "@/client"

export interface CreateListingInput {
  title: string
  description: string
  price: string | number
  category_id: string | number
  condition_grade: string
  is_negotiable: boolean
}

export interface UpdateListingInput {
  title?: string
  description?: string
  price?: string | number
  category_id?: string | number
  condition_grade?: string
  is_negotiable?: boolean
}

export async function getMyListings(params?: {
  keyword?: string
  status?: string
  skip?: number
  limit?: number
}): Promise<ListingPaginated> {
  return ListingsService.getMyListingsApiV1ListingsMeGet({
    ...params,
    status: params?.status as ListingStatus | undefined,
  })
}

export async function createListing(
  data: CreateListingInput,
): Promise<ListingRead> {
  return ListingsService.createListingApiV1ListingsPost({
    requestBody: data as any,
  })
}

export async function updateListing(
  listingId: string,
  data: UpdateListingInput,
): Promise<ListingRead> {
  return ListingsService.updateListingApiV1ListingsListingIdPatch({
    listingId,
    requestBody: data as any,
  })
}

export async function deleteListing(listingId: string): Promise<void> {
  return ListingsService.deleteListingApiV1ListingsListingIdDelete({
    listingId,
  })
}

export async function getListingDetails(
  listingId: string,
): Promise<ListingWithImages> {
  return ListingsService.getListingApiV1ListingsListingIdGet({
    listingId,
  })
}

export async function uploadListingImage(
  listingId: string,
  file: File,
  isPrimary: boolean = false,
): Promise<any> {
  return ListingsService.uploadListingImageApiV1ListingsListingIdImagesPost({
    listingId,
    formData: { file: file as any },
    isPrimary,
  })
}

export async function deleteListingImage(imageId: string): Promise<void> {
  return ListingsService.deleteListingImageRouteApiV1ListingsImagesImageIdDelete(
    {
      imageId,
    },
  )
}
