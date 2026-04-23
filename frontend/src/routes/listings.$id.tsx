import { createFileRoute } from "@tanstack/react-router"
import { ListingDetailPage } from "@/features/listings/pages/ListingDetailPage"

export const Route = createFileRoute("/listings/$id")({
  component: ListingDetailPage,
})
