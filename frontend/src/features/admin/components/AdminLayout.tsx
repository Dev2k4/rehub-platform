import { useState } from "react"
import { Box, Flex, Button, Spinner } from "@chakra-ui/react"
import { Outlet, useNavigate } from "@tanstack/react-router"
import { FiMenu } from "react-icons/fi"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { AdminSidebar } from "./AdminSidebar"
import { AdminDrawer } from "./AdminDrawer"

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user, isLoading, isAuthenticated } = useAuthUser()
  const navigate = useNavigate()

  // Redirect if not admin
  if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
    navigate({ to: "/" })
    return null
  }

  // Loading state
  if (isLoading) {
    return (
      <Flex minH="100vh" align="center" justify="center" bg="gray.50">
        <Spinner size="lg" color="blue.500" />
      </Flex>
    )
  }

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Mobile menu button */}
      <Box display={{ base: "block", lg: "none" }} position="fixed" top={4} left={4} zIndex={40}>
        <Button
          onClick={() => setDrawerOpen(true)}
          variant="solid"
          bg="white"
          boxShadow="md"
          size="sm"
        >
          <Box as={FiMenu} w={5} h={5} />
        </Button>
      </Box>

      {/* Mobile drawer */}
      <AdminDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      {/* Main content with sidebar */}
      <Flex gap={8} maxW="8xl" mx="auto" px={{ base: 4, lg: 8 }} py={{ base: 16, lg: 8 }}>
        <AdminSidebar />

        <Box flex={1} minW={0}>
          <Outlet />
        </Box>
      </Flex>
    </Box>
  )
}
