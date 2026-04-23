import { createFileRoute } from "@tanstack/react-router"
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage"

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
})
