import type { ListingPaginated, UserPublicProfile } from "@/client"
import { ListingsService, UsersService } from "@/client"

export async function getUserPublicProfile(
  userId: string,
): Promise<UserPublicProfile> {
  return UsersService.getUserPublicProfileApiV1UsersUserIdProfileGet({
    userId,
  })
}

export async function getSellerListings(params: {
  sellerId: string
  skip?: number
  limit?: number
}): Promise<ListingPaginated> {
  return ListingsService.listListingsApiV1ListingsGet({
    sellerId: params.sellerId,
    skip: params.skip,
    limit: params.limit,
  })
}
