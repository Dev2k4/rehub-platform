import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const AdminCategoriesPage = lazy(() =>
  import("@/features/admin/pages/AdminCategoriesPage").then((module) => ({
    default: module.AdminCategoriesPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="40vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function AdminCategoriesRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminCategoriesPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/admin/categories")({
  component: AdminCategoriesRoutePage,
})
