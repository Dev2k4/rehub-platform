import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  buyerConfirmReceived,
  getFulfillment,
  markDelivered,
  markShipping,
  startPreparing,
} from "@/features/fulfillment/api/fulfillment.api"

export function useFulfillment(orderId: string) {
  return useQuery({
    queryKey: ["fulfillment", orderId],
    queryFn: () => getFulfillment(orderId),
    enabled: !!orderId,
    retry: 2,
  })
}

export function useStartPreparing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => startPreparing(orderId),
    onSuccess: (fulfillment, orderId) => {
      queryClient.setQueryData(["fulfillment", orderId], fulfillment)
      queryClient.invalidateQueries({ queryKey: ["fulfillment", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
    },
  })
}

export function useMarkShipping() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { orderId: string; note?: string }) =>
      markShipping(params.orderId, { note: params.note }),
    onSuccess: (fulfillment, params) => {
      queryClient.setQueryData(["fulfillment", params.orderId], fulfillment)
      queryClient.invalidateQueries({ queryKey: ["fulfillment", params.orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", params.orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
    },
  })
}

export function useMarkDelivered() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { orderId: string; proofImageUrls: string[]; note?: string }) =>
      markDelivered(params.orderId, {
        proof_image_urls: params.proofImageUrls,
        note: params.note,
      }),
    onSuccess: (fulfillment, params) => {
      queryClient.setQueryData(["fulfillment", params.orderId], fulfillment)
      queryClient.invalidateQueries({ queryKey: ["fulfillment", params.orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", params.orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
      queryClient.invalidateQueries({ queryKey: ["escrow", params.orderId] })
    },
  })
}

export function useBuyerConfirmReceived() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { orderId: string; proofImageUrls: string[]; note?: string }) =>
      buyerConfirmReceived(params.orderId, {
        proof_image_urls: params.proofImageUrls,
        note: params.note,
      }),
    onSuccess: (fulfillment, params) => {
      queryClient.setQueryData(["fulfillment", params.orderId], fulfillment)
      queryClient.invalidateQueries({ queryKey: ["fulfillment", params.orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", params.orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
      queryClient.invalidateQueries({ queryKey: ["escrow", params.orderId] })
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] })
    },
  })
}
