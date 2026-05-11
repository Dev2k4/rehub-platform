import { createFileRoute } from "@tanstack/react-router"
import { AdminOrdersPage } from "@/features/admin/pages/AdminOrdersPage"

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
})
