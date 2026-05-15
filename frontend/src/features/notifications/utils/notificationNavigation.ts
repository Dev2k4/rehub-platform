import type { NotificationRead } from "@/client"

function getDataField(
  data: NotificationRead["data"],
  field: string,
): string | null {
  if (!data || typeof data !== "object") {
    return null
  }

  const value = (data as Record<string, unknown>)[field]
  return typeof value === "string" && value.trim() ? value : null
}

/** Signal đặc biệt: không navigate mà mở modal chi tiết tin đăng bị từ chối. */
export interface RejectedListingSignal {
  type: "rejected_listing_modal"
  listingId: string
  reasonReject: string
}

export function getNotificationDestination(notification: NotificationRead):
  | RejectedListingSignal
  | {
      to: "/listings/$id"
      params: { id: string }
      search?: { offerId?: string }
    }
  | { to: "/orders/$id"; params: { id: string } }
  | { to: "/sellers/$id"; params: { id: string } }
  | { to: "/my-listings" }
  | { to: "/orders" }
  | { to: "/profile" }
  | { to: "/" } {
  const orderId = getDataField(notification.data, "order_id")
  const listingId = getDataField(notification.data, "listing_id")
  const offerId = getDataField(notification.data, "offer_id")
  const sellerId = getDataField(notification.data, "seller_id")
  const reasonReject = getDataField(notification.data, "reason_reject") ?? ""

  // Intercept tin đăng bị từ chối → mở modal thay vì navigate sang listing page
  if (notification.type === "listing_rejected" && listingId) {
    return {
      type: "rejected_listing_modal",
      listingId,
      reasonReject,
    }
  }

  if (
    orderId &&
    (notification.type.startsWith("order_") ||
      notification.type.startsWith("escrow_"))
  ) {
    return { to: "/orders/$id", params: { id: orderId } }
  }

  if (listingId) {
    const destination = {
      to: "/listings/$id" as const,
      params: { id: listingId },
    }
    if (offerId && notification.type.startsWith("offer_")) {
      return { ...destination, search: { offerId } }
    }
    return destination
  }

  if (sellerId) {
    return { to: "/sellers/$id", params: { id: sellerId } }
  }

  if (notification.type.startsWith("offer_")) {
    return { to: "/my-listings" }
  }

  if (notification.type.startsWith("order_")) {
    return { to: "/orders" }
  }

  if (notification.type.startsWith("escrow_")) {
    return { to: "/orders" }
  }

  if (notification.type.startsWith("review_")) {
    return { to: "/profile" }
  }

  return { to: "/" }
}
