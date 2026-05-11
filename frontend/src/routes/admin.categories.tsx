import { createFileRoute } from "@tanstack/react-router"
import { AdminCategoriesPage } from "@/features/admin/pages/AdminCategoriesPage"

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesPage,
})
