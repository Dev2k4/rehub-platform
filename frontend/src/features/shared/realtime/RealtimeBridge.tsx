import { Box, Text } from "@chakra-ui/react"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { useRealtimeNotifications } from "@/features/notifications/hooks/useRealtimeNotifications"
import { useRealtimeCommerce } from "./useRealtimeCommerce"
import { useRealtimeFinance } from "./useRealtimeFinance"
import { useRealtimeListings } from "./useRealtimeListings"
import { useRealtimeProfiles } from "./useRealtimeProfiles"
import { useWebSocketStatus } from "./ws.provider"

export function RealtimeBridge() {
  const { user, isAuthenticated } = useAuthUser()
  const { connected } = useWebSocketStatus()

  useRealtimeNotifications(isAuthenticated && !!user)
  useRealtimeCommerce(isAuthenticated)
  useRealtimeFinance(isAuthenticated)
  useRealtimeListings(isAuthenticated)
  useRealtimeProfiles(isAuthenticated)

  if (!import.meta.env.DEV || !isAuthenticated) {
    return null
  }

  return (
    <Box
      position="fixed"
      right={4}
      bottom={4}
      zIndex={1000}
      px={3}
      py={1.5}
      borderRadius="full"
      bg={connected ? "green.500" : "red.500"}
      color="white"
      boxShadow="lg"
      fontSize="xs"
      fontWeight="semibold"
      pointerEvents="none"
    >
      <Text>WS: {connected ? "Connected" : "Disconnected"}</Text>
    </Box>
  )
}
