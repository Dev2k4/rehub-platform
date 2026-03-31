import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  listDisputedEscrows,
  resolveEscrowAsAdmin,
} from "@/features/escrow/api/escrow.api"

export function useDisputedEscrows(params?: { skip?: number; limit?: number }) {
  return useQuery({
    queryKey: ["admin", "escrows", "disputed", params],
    queryFn: () => listDisputedEscrows(params),
  })
}

export function useAdminResolveEscrow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: {
      orderId: string
      result: "release" | "refund"
      note?: string
    }) =>
      resolveEscrowAsAdmin(params.orderId, {
        result: params.result,
        note: params.note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["admin", "escrows", "disputed"],
      })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
    },
  })
}
