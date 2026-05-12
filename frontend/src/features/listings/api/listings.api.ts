import type { ListingPaginated, ListingRead, ListingWithImages } from "@/client"
import {
  ApiError,
  type ListingStatus,
  ListingsService,
  OpenAPI,
} from "@/client"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

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

export async function createListingWithImagesAtomic(
  data: CreateListingInput,
  files: File[],
): Promise<ListingWithImages> {
  const formData = new FormData()
  formData.append("title", String(data.title))
  formData.append("description", String(data.description ?? ""))
  formData.append("price", String(data.price))
  formData.append("category_id", String(data.category_id))
  formData.append("condition_grade", String(data.condition_grade))
  formData.append("is_negotiable", String(Boolean(data.is_negotiable)))
  for (const file of files) {
    formData.append("files", file)
  }

  const token = getAccessToken()
  const response = await fetch(`${OpenAPI.BASE}/api/v1/listings/with-images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
    credentials: OpenAPI.WITH_CREDENTIALS ? "include" : "same-origin",
  })

  const body = await response.json().catch(() => undefined)

  if (!response.ok) {
    throw new ApiError(
      { method: "POST", url: "/api/v1/listings/with-images" } as any,
      {
        url: `${OpenAPI.BASE}/api/v1/listings/with-images`,
        ok: false,
        status: response.status,
        statusText: response.statusText,
        body,
      },
      response.statusText || "Failed to create listing",
    )
  }

  return body as ListingWithImages
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
