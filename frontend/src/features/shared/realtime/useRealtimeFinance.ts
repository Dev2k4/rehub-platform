import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import type { EscrowRead } from "@/features/escrow/api/escrow.api"
import type { WalletAccountRead } from "@/features/wallet/api/wallet.api"
import { wsClient } from "./ws.client"

type WalletEventPayload = {
  wallet?: WalletAccountRead
}

type EscrowEventPayload = {
  escrow?: EscrowRead
}

export function useRealtimeFinance(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const unsubscribeWallet = wsClient.on("wallet:balance_updated", (data) => {
      const payload = data as WalletEventPayload
      if (payload.wallet) {
        queryClient.setQueryData(["wallet", "me"], payload.wallet)
      }
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    })

    const unsubscribeEscrow = wsClient.on("escrow:state_changed", (data) => {
      const payload = data as EscrowEventPayload
      if (payload.escrow) {
        queryClient.setQueryData(
          ["escrow", payload.escrow.order_id],
          payload.escrow,
        )
        queryClient.invalidateQueries({
          queryKey: ["fulfillment", payload.escrow.order_id],
        })
      }
      queryClient.invalidateQueries({ queryKey: ["escrow"] })
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      queryClient.invalidateQueries({ queryKey: ["wallet"] })
    })

    return () => {
      unsubscribeWallet()
      unsubscribeEscrow()
    }
  }, [enabled, queryClient])
}
