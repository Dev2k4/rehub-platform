import { Box } from "@chakra-ui/react"
import {
  createRootRoute,
  Outlet,
  useMatchRoute,
} from "@tanstack/react-router"
import { MarketplaceHeader } from "@/features/home/components/MarketplaceHeader"

function AppLayout() {
  const matchRoute = useMatchRoute()
  const isHome = Boolean(matchRoute({ to: "/", fuzzy: false }))

  return (
    <Box minH="100vh" bg="gray.50">
      {!isHome && (
        <Box position="fixed" top={0} left={0} right={0} zIndex={1000}>
          <MarketplaceHeader />
        </Box>
      )}
      <Box pt={isHome ? 0 : { base: "76px", sm: "92px" }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export const Route = createRootRoute({
  component: AppLayout,
})
