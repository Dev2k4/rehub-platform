import { createFileRoute } from "@tanstack/react-router"
import { AdminListingsPage } from "@/features/admin/pages/AdminListingsPage"

export const Route = createFileRoute("/admin/listings")({
  component: AdminListingsPage,
})
