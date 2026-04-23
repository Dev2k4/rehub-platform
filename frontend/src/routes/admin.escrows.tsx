import { createFileRoute } from "@tanstack/react-router"
import { AdminEscrowsPage } from "@/features/admin/pages/AdminEscrowsPage"

export const Route = createFileRoute("/admin/escrows")({
  component: AdminEscrowsPage,
})
