import { FiMenu, FiSearch, FiPackage, FiPlusCircle, FiBell } from "react-icons/fi"
import { Link, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Box, Flex, IconButton, Button, Input, Text, Link as ChakraLink } from "@chakra-ui/react"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { UserDropdownMenu } from "./UserDropdownMenu"
import { AuthButtons } from "./AuthButtons"
import { logoutUser } from "@/features/auth/api/auth.api"
import { clearTokens } from "@/features/auth/utils/auth.storage"

type MarketplaceHeaderProps = {
  keyword: string
  onKeywordChange: (value: string) => void
  onOpenCategoryMenu: () => void
  onOpenListingModal?: () => void
}

export function MarketplaceHeader({ keyword, onKeywordChange, onOpenCategoryMenu, onOpenListingModal }: MarketplaceHeaderProps) {
  const { user, isAuthenticated, isLoading } = useAuthUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      clearTokens()
      queryClient.invalidateQueries({ queryKey: ["auth"] })
      navigate({ to: "/" })
    }
  }

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={50}
      borderBottom="1px"
      borderColor="gray.200"
      bg="whiteAlpha.800"
      backdropFilter="blur(12px)"
      px={{ base: 4, md: 6 }}
      py={{ base: 3, md: 4 }}
      boxShadow="sm"
    >
      <Flex
        mx="auto"
        maxW="1400px"
        direction={{ base: "column", sm: "row" }}
        gap={{ base: 3, sm: 6, md: 8 }}
        align={{ sm: "center" }}
        justify={{ sm: "space-between" }}
      >
        {/* Top Header Mobile / Full Header Left Desktop */}
        <Flex align="center" justify="space-between" w={{ base: "full", sm: "auto" }}>
          <Flex align="center" gap={{ base: 3, md: 4 }}>
            <IconButton
              display={{ base: "inline-flex", lg: "none" }}
              aria-label="Open category menu"
              onClick={onOpenCategoryMenu}
              h={10}
              w={10}
              borderRadius="xl"
              bg="gray.100"
              color="gray.700"
              _hover={{ bg: "gray.200" }}
            >
              <FiMenu size={20} />
            </IconButton>

            <ChakraLink asChild>
              <Link to="/">
                <Flex align="center" gap={2}>
                  <Box
                    display="flex"
                    h={10}
                    w={10}
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="xl"
                    bgGradient="linear(to-br, blue.600, purple.600)"
                  >
                    <Box as={FiPackage} w={6} h={6} color="white" />
                  </Box>
                  <Text fontSize="xl" fontWeight="semibold" color="gray.900">
                    ReHub
                  </Text>
                </Flex>
              </Link>
            </ChakraLink>
          </Flex>

          {/* Mobile Right Icons (hidden on sm+) */}
          <Flex display={{ base: "flex", sm: "none" }} align="center" gap={2}>
            <IconButton
              aria-label="Post listing"
              onClick={onOpenListingModal}
              borderRadius="full"
              bg="blue.600"
              color="white"
              h={10}
              w={10}
              _hover={{ bg: "blue.700" }}
            >
              <FiPlusCircle size={20} />
            </IconButton>
          </Flex>
        </Flex>

        {/* Search Input */}
        <Box flex={1} w="full" maxW="2xl">
          <Box position="relative">
            <Box position="absolute" left={4} top="50%" transform="translateY(-50%)" zIndex={1}>
              <FiSearch size={20} color="gray" />
            </Box>
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="Tìm kiếm sản phẩm, danh mục, hoặc người bán..."
              w="full"
              borderRadius="full"
              border="none"
              bg="gray.100"
              py={3}
              pl={12}
              pr={4}
              fontSize="sm"
              color="gray.900"
              transition="all 0.2s"
              _placeholder={{ color: "gray.500" }}
              _focus={{ bg: "white", ring: "2", ringColor: "blue.500", ringOffset: "2", ringOffsetColor: "transparent" }}
            />
          </Box>
        </Box>

        {/* Desktop Right Icons (hidden on mobile) */}
        <Flex display={{ base: "none", sm: "flex" }} align="center" gap={2}>
          <IconButton
            aria-label="Notifications"
            position="relative"
            borderRadius="full"
            p={2.5}
            color="gray.600"
            variant="ghost"
            _hover={{ bg: "gray.100" }}
          >
            <FiBell size={20} />
            <Box position="absolute" right="6px" top="6px" h={2} w={2} borderRadius="full" bg="red.500" />
          </IconButton>

          <ChakraLink asChild>
            <Link to="/">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  onOpenListingModal?.()
                }}
                borderRadius="full"
                bg="blue.600"
                color="white"
                px={4}
                py={2.5}
                fontSize="sm"
                fontWeight="medium"
                _hover={{ bg: "blue.700" }}
              >
                <Flex align="center" gap={2}>
                  <FiPlusCircle size={16} />
                  <span>Đăng tin</span>
                </Flex>
              </Button>
            </Link>
          </ChakraLink>

          {/* Auth Section: Login buttons OR User menu */}
          {isLoading ? (
            <Box w={10} h={10} bg="gray.200" borderRadius="full" animation="pulse 2s infinite" />
          ) : isAuthenticated && user ? (
            <UserDropdownMenu user={user} onLogout={handleLogout} />
          ) : (
            <AuthButtons />
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
