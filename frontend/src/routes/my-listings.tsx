import { createFileRoute } from "@tanstack/react-router"
import { Flex, Spinner } from "@chakra-ui/react"
import { lazy, Suspense } from "react"

const MyListingsPage = lazy(() =>
  import("@/features/listings/pages/MyListingsPage").then((module) => ({
    default: module.MyListingsPage,
  })),
)

function RouteFallback() {
  return (
    <Flex minH="50vh" align="center" justify="center">
      <Spinner size="md" color="blue.500" />
    </Flex>
  )
}

function MyListingsRoutePage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <MyListingsPage />
    </Suspense>
  )
}

export const Route = createFileRoute("/my-listings")({
  component: MyListingsRoutePage,
})
