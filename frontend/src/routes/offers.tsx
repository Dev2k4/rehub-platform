import { createFileRoute } from "@tanstack/react-router"
import { OffersPage } from "@/features/offers/pages/OffersPage"

export const Route = createFileRoute("/offers")({
  component: OffersPage,
})
