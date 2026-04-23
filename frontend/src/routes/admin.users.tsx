import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const AdminUsersPage = lazy(() =>
  import("@/features/admin/pages/AdminUsersPage").then((module) => ({
    default: module.AdminUsersPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="40vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function AdminUsersRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminUsersPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersRoutePage,
})
