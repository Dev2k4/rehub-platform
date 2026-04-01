import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { OfferRead, OrderRead } from "@/client"
import { wsClient } from "./ws.client"

type OrderEventPayload = {
  order?: OrderRead
}

type OfferEventPayload = {
  offer?: OfferRead
}

type OfferExpiredPayload = {
  offer_id?: string
  listing_id?: string
}

export function useRealtimeCommerce(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const unsubscribeOrder = wsClient.on("order:status_changed", (data) => {
      const payload = data as OrderEventPayload
      const incoming = payload.order

      if (incoming) {
        queryClient.setQueryData<OrderRead>(["orders", incoming.id], incoming)
        queryClient.setQueryData<OrderRead[]>(["orders", "me"], (old) => {
          if (!old) {
            return old
          }
          return old.map((item) => (item.id === incoming.id ? incoming : item))
        })
      }

      queryClient.invalidateQueries({ queryKey: ["orders"] })
    })

    const unsubscribeOffer = wsClient.on("offer:status_changed", (data) => {
      const payload = data as OfferEventPayload
      const incoming = payload.offer

      if (incoming) {
        queryClient.setQueriesData<OfferRead[]>({ queryKey: ["offers"] }, (old) => {
          if (!old) {
            return old
          }
          return old.map((item) => (item.id === incoming.id ? incoming : item))
        })
      }

      queryClient.invalidateQueries({ queryKey: ["offers"] })
    })

    const unsubscribeOfferExpired = wsClient.on("offer:expired", (data) => {
      const payload = data as OfferExpiredPayload
      if (payload.offer_id) {
        queryClient.setQueriesData<OfferRead[]>({ queryKey: ["offers"] }, (old) => {
          if (!old) {
            return old
          }
          return old.map((item) =>
            item.id === payload.offer_id ? { ...item, status: "expired" } : item,
          )
        })
      }

      if (payload.listing_id) {
        queryClient.invalidateQueries({ queryKey: ["offers", "listing", payload.listing_id] })
      }
      queryClient.invalidateQueries({ queryKey: ["offers"] })
    })

    return () => {
      unsubscribeOrder()
      unsubscribeOffer()
      unsubscribeOfferExpired()
    }
  }, [enabled, queryClient])
}