import { AdminService } from "@/client"
import type { ListingRead } from "@/client"

export async function getPendingListings(params?: {
  skip?: number
  limit?: number
}): Promise<ListingRead[]> {
  return AdminService.getPendingListingsRouteApiV1AdminListingsPendingGet(params || {})
}

export async function approveListing(listingId: string): Promise<ListingRead> {
  return AdminService.approveListingApiV1AdminListingsListingIdApprovePost({ listingId })
}

export async function rejectListing(listingId: string): Promise<ListingRead> {
  return AdminService.rejectListingRouteApiV1AdminListingsListingIdRejectPost({ listingId })
}
