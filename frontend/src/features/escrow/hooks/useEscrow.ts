import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  confirmEscrowRelease,
  fundEscrow,
  getEscrow,
  openEscrowDispute,
  requestEscrowRelease,
} from "@/features/escrow/api/escrow.api"
import { demoTopupWallet, getMyWallet } from "@/features/wallet/api/wallet.api"

export function useEscrow(orderId: string) {
  return useQuery({
    queryKey: ["escrow", orderId],
    queryFn: () => getEscrow(orderId),
    enabled: !!orderId,
    retry: 3,
    retryDelay: 500,
  })
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet", "me"],
    queryFn: () => getMyWallet(),
  })
}

export function useDemoTopupWallet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (amount: number) => demoTopupWallet(amount),
    onSuccess: (wallet) => {
      queryClient.setQueryData(["wallet", "me"], wallet)
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] })
    },
  })
}

export function useFundEscrow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => fundEscrow(orderId),
    onSuccess: (escrow, orderId) => {
      queryClient.setQueryData(["escrow", orderId], escrow)
      queryClient.invalidateQueries({ queryKey: ["escrow", orderId] })
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] })
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
    },
  })
}

export function useRequestEscrowRelease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => requestEscrowRelease(orderId),
    onSuccess: (escrow, orderId) => {
      queryClient.setQueryData(["escrow", orderId], escrow)
      queryClient.invalidateQueries({ queryKey: ["escrow", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
    },
  })
}

export function useConfirmEscrowRelease() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => confirmEscrowRelease(orderId),
    onSuccess: (escrow, orderId) => {
      queryClient.setQueryData(["escrow", orderId], escrow)
      queryClient.invalidateQueries({ queryKey: ["escrow", orderId] })
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] })
      queryClient.invalidateQueries({ queryKey: ["orders", orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
    },
  })
}

export function useOpenEscrowDispute() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (params: { orderId: string; note?: string }) =>
      openEscrowDispute(params.orderId, { note: params.note }),
    onSuccess: (escrow, params) => {
      queryClient.setQueryData(["escrow", params.orderId], escrow)
      queryClient.invalidateQueries({ queryKey: ["escrow", params.orderId] })
      queryClient.invalidateQueries({ queryKey: ["wallet", "me"] })
      queryClient.invalidateQueries({ queryKey: ["orders", params.orderId] })
      queryClient.invalidateQueries({ queryKey: ["orders", "me"] })
    },
  })
}
