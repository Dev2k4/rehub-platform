import { useEffect } from "react"
import { useNavigate, Link } from "@tanstack/react-router"
import { Box, Container, Heading, Text, Link as ChakraLink, VStack } from "@chakra-ui/react"
import { getAccessToken } from "@/features/auth/utils/auth.storage"
import { LoginForm } from "@/features/auth/components/LoginForm"

export function LoginPage() {
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (getAccessToken()) {
      navigate({ to: "/" })
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
            Đăng nhập
          </Heading>
          <Text fontSize="sm" color="gray.600" mt={2}>
            Hoặc{" "}
            <ChakraLink asChild color="blue.600" fontWeight="medium" _hover={{ color: "blue.700" }}>
              <Link to="/auth/register">tạo tài khoản mới</Link>
            </ChakraLink>
          </Text>
        </VStack>

        {/* Form */}
        <Box bg="white" py={8} px={6} boxShadow="md" borderRadius="lg">
          <LoginForm />
        </Box>

        {/* Footer */}
        <Text textAlign="center" fontSize="xs" color="gray.500" mt={8}>
          Nếu bạn gặp sự cố với việc đăng nhập,{" "}
          <ChakraLink href="#" color="blue.600" _hover={{ color: "blue.700" }}>
            liên hệ hỗ trợ
          </ChakraLink>
        </Text>
      </Container>
    </Box>
  )
}
