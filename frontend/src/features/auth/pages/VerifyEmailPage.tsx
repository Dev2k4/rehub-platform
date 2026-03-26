import { useEffect } from "react"
import { useNavigate, Link } from "@tanstack/react-router"
import { Box, Container, Heading, Text, Link as ChakraLink, VStack } from "@chakra-ui/react"
import { getAccessToken } from "@/features/auth/utils/auth.storage"
import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm"

export function VerifyEmailPage() {
  const navigate = useNavigate()

  // Redirect if not logged in (no access token)
  useEffect(() => {
    if (!getAccessToken()) {
      navigate({ to: "/auth/login" })
    }
  }, [navigate])

  return (
    <Box minH="100vh" bg="gray.50" display="flex" flexDir="column" justifyContent="center" py={12} px={4}>
      <Container maxW="md">
        {/* Header */}
        <VStack gap={2} textAlign="center" mb={8}>
          <Heading as="h1" size="2xl" color="gray.900">
            ReHub
          </Heading>
          <Heading as="h2" size="lg" color="gray.900" mt={6}>
            Xác thực Email
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={2}>
            Chúng tôi đã gửi một email xác thực đến bạn
          </Text>
        </VStack>

        {/* Form */}
        <Box bg="white" py={8} px={6} boxShadow="md" borderRadius="lg">
          <VerifyEmailForm />
        </Box>

        {/* Footer */}
        <VStack gap={4} mt={8} textAlign="center">
          <Text fontSize="xs" color="gray.500">
            Các vấn đề về xác thực?{" "}
            <ChakraLink asChild color="blue.600" _hover={{ color: "blue.700" }}>
              <Link to="/auth/login">Quay lại đăng nhập</Link>
            </ChakraLink>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}
