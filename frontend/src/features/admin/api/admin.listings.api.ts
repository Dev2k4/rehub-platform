import type { ListingRead } from "@/client"
import { AdminService, OpenAPI } from "@/client"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

export async function getPendingListings(params?: {
  skip?: number
  limit?: number
}): Promise<ListingRead[]> {
  return AdminService.getPendingListingsRouteApiV1AdminListingsPendingGet(
    params || {},
  )
}

export async function approveListing(listingId: string): Promise<ListingRead> {
  return AdminService.approveListingApiV1AdminListingsListingIdApprovePost({
    listingId,
  })
}

export async function rejectListing(
  listingId: string,
  reason?: string,
): Promise<ListingRead> {
  // Gọi trực tiếp để truyền body { reason } — generated client không hỗ trợ body cho POST này.
  const baseUrl = (OpenAPI.BASE as string) || ""
  const token = getAccessToken()

  const res = await fetch(
    `${baseUrl}/api/v1/admin/listings/${listingId}/reject`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ reason: reason || null }),
    },
  )

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    throw new Error(detail?.detail ?? `Request failed: ${res.status}`)
  }

  return res.json() as Promise<ListingRead>
}
