import { OffersService } from "@/client"
import type { OfferRead, OfferCreate, OfferStatusUpdate } from "@/client"

export async function createOffer(data: OfferCreate): Promise<OfferRead> {
  return OffersService.createOfferApiV1OffersPost({
    requestBody: data,
  })
}

export async function getMySentOffers(params?: {
  skip?: number
  limit?: number
}): Promise<OfferRead[]> {
  return OffersService.getMySentOffersApiV1OffersMeSentGet(params)
}

export async function getMyReceivedOffers(params?: {
  skip?: number
  limit?: number
}): Promise<OfferRead[]> {
  return OffersService.getMyReceivedOffersApiV1OffersMeReceivedGet(params)
}

export async function getOffersForListing(
  listingId: string,
  params?: { skip?: number; limit?: number },
): Promise<OfferRead[]> {
  return OffersService.getOffersForListingApiV1OffersListingListingIdGet({
    listingId,
    ...params,
  })
}

export async function getOffer(offerId: string): Promise<OfferRead> {
  return OffersService.getOfferApiV1OffersOfferIdGet({ offerId })
}

export async function updateOfferStatus(
  offerId: string,
  data: OfferStatusUpdate,
): Promise<OfferRead> {
  return OffersService.updateOfferStatusApiV1OffersOfferIdStatusPatch({
    offerId,
    requestBody: data,
  })
}
