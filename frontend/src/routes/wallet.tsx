import { createFileRoute } from "@tanstack/react-router"
import { WalletPage } from "@/features/wallet/pages/WalletPage"

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
})
