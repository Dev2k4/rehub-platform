import { createFileRoute } from "@tanstack/react-router"
import { SellerProfilePage } from "@/features/users/pages/SellerProfilePage"

export const Route = createFileRoute("/sellers/$id")({
  component: SellerProfilePage,
})
