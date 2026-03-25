import { FiMenu, FiSearch, FiPackage, FiPlusCircle, FiBell } from "react-icons/fi"
import { Link, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { Box, Button, Input as ChakraInput, HStack, VStack } from "@chakra-ui/react"
import { useAuthUser } from "@/features/auth/hooks/useAuthUser"
import { UserDropdownMenu } from "./UserDropdownMenu"
import { AuthButtons } from "./AuthButtons"
import { logoutUser } from "@/features/auth/api/auth.api"
import { clearTokens } from "@/features/auth/utils/auth.storage"

type MarketplaceHeaderProps = {
  keyword: string
  onKeywordChange: (value: string) => void
  onOpenCategoryMenu: () => void
}

export function MarketplaceHeader({ keyword, onKeywordChange, onOpenCategoryMenu }: MarketplaceHeaderProps) {
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
      bg="rgba(255, 255, 255, 0.8)"
      backdropFilter="blur(8px)"
      px={{ base: 4, md: 6 }}
      py={{ base: 3, md: 4 }}
      boxShadow="sm"
    >
      <VStack maxW="1400px" mx="auto" gap={3} align="stretch">
        {/* Top Row: Logo + Mobile Menu Button + Mobile Action Button */}
        <HStack justify="space-between" w="full">
          <HStack gap={{ base: 3, md: 4 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenCategoryMenu}
              p={0}
              w="40px"
              h="40px"
              display={{ base: "flex", lg: "none" }}
              alignItems="center"
              justifyContent="center"
              bg="gray.100"
              _hover={{ bg: "gray.200" }}
            >
              <FiMenu className="w-5 h-5" />
            </Button>

            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Box
                w="40px"
                h="40px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="xl"
                bgGradient="linear(to-br, blue.600, purple.600)"
              >
                <FiPackage className="w-6 h-6 text-white" />
              </Box>
              <Box fontSize="xl" fontWeight="semibold" color="gray.900" display={{ base: "none", sm: "block" }}>
                ReHub
              </Box>
            </Link>
          </HStack>

          {/* Mobile Right Icon */}
          <Link to="/" style={{ display: "flex" }}>
            <Button
              size="sm"
              colorScheme="blue"
              borderRadius="full"
              w="40px"
              h="40px"
              p={0}
              display={{ base: "flex", sm: "none" }}
              alignItems="center"
              justifyContent="center"
            >
              <FiPlusCircle className="w-5 h-5" />
            </Button>
          </Link>
        </HStack>

        {/* Search Row */}
        <Box position="relative" flex={1} w="full" maxW="2xl">
          <FiSearch
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "20px",
              color: "#a0aec0",
            }}
          />
          <ChakraInput
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="Tìm kiếm sản phẩm, danh mục, hoặc người bán..."
            borderRadius="full"
            bg="gray.100"
            border="none"
            pl="45px"
            pr="16px"
            py="12px"
            fontSize="sm"
            _focus={{
              bg: "white",
              boxShadow: "0 0 0 2px rgba(66, 153, 225, 0.2)",
            }}
          />
        </Box>

        {/* Desktop Right Section */}
        <HStack justify="flex-end" gap={2} display={{ base: "none", sm: "flex" }}>
          <Box position="relative">
            <Button variant="ghost" size="sm" p={2.5} borderRadius="full">
              <FiBell className="w-5 h-5" />
            </Button>
            <Box
              position="absolute"
              right="6px"
              top="6px"
              w="2"
              h="2"
              borderRadius="full"
              bg="red.500"
            />
          </Box>

          <Link to="/">
            <Button
              colorScheme="blue"
              borderRadius="full"
              size="sm"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <FiPlusCircle className="w-4 h-4" />
              <span>Đăng tin</span>
            </Button>
          </Link>

          {/* Auth Section */}
          {isLoading ? (
            <Box w="40px" h="10" bg="gray.200" borderRadius="full" animation="pulse 2s infinite" />
          ) : isAuthenticated && user ? (
            <UserDropdownMenu user={user} onLogout={handleLogout} />
          ) : (
            <AuthButtons />
          )}
        </HStack>
      </VStack>
    </Box>
  )
}
