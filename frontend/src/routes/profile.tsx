import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const ProfilePage = lazy(() =>
  import("@/features/users/pages/ProfilePage").then((module) => ({
    default: module.ProfilePage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="50vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function ProfileRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ProfilePage />
    </Suspense>
  )
}

export const Route = createFileRoute("/profile")({
  component: ProfileRoutePage,
})
