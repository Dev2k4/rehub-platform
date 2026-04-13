import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { toaster } from "@/components/ui/toaster"
import { wsClient } from "./ws.client"

type ListingPayload = {
  listing?: {
    id?: string
    title?: string
    status?: string
    seller_id?: string
  }
}

export function useRealtimeListings(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const invalidateListingQueries = () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] })
      queryClient.invalidateQueries({ queryKey: ["listings", "my-listings"] })
      queryClient.invalidateQueries({ queryKey: ["listings", "public"] })
      queryClient.invalidateQueries({ queryKey: ["listings"] })
    }

    const onApproved = (data: unknown) => {
      const payload = data as ListingPayload
      invalidateListingQueries()
      if (payload.listing?.title) {
        toaster.create({
          title: "Tin đăng đã được duyệt",
          description: payload.listing.title,
          type: "success",
        })
      }
    }

    const onRejected = (data: unknown) => {
      const payload = data as ListingPayload
      invalidateListingQueries()
      if (payload.listing?.title) {
        toaster.create({
          title: "Tin đăng đã bị từ chối",
          description: payload.listing.title,
          type: "warning",
        })
      }
    }

    const onStatusUpdated = () => {
      invalidateListingQueries()
    }

    const onCreated = () => {
      invalidateListingQueries()
    }

    const onUpdated = (data: unknown) => {
      const payload = data as ListingPayload
      invalidateListingQueries()
      if (payload.listing?.title) {
        toaster.create({
          title: "Tin đăng đã được cập nhật",
          description: payload.listing.title,
          type: "info",
        })
      }
    }

    const onHidden = (data: unknown) => {
      const payload = data as ListingPayload
      invalidateListingQueries()
      if (payload.listing?.title) {
        toaster.create({
          title: "Tin đăng đã được ẩn",
          description: payload.listing.title,
          type: "warning",
        })
      }
    }

    const unsubscribeCreated = wsClient.on("listing:created", onCreated)
    const unsubscribeUpdated = wsClient.on("listing:updated", onUpdated)
    const unsubscribeHidden = wsClient.on("listing:hidden", onHidden)
    const unsubscribeApproved = wsClient.on("listing:approved", onApproved)
    const unsubscribeRejected = wsClient.on("listing:rejected", onRejected)
    const unsubscribeStatus = wsClient.on(
      "listing:status_updated",
      onStatusUpdated,
    )

    return () => {
      unsubscribeCreated()
      unsubscribeUpdated()
      unsubscribeHidden()
      unsubscribeApproved()
      unsubscribeRejected()
      unsubscribeStatus()
    }
  }, [enabled, queryClient])
}
