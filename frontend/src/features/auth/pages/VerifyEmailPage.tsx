import {
  Box,
  Link as ChakraLink,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiPackage } from "react-icons/fi"
import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm"

export function VerifyEmailPage() {
  return (
    <Box
      minH="100vh"
      bg="gray.50"
      display="flex"
      alignItems="center"
      justifyContent="center"
      py={12}
      px={4}
    >
      <Container maxW="md" w="full">
        {/* Header */}
        <VStack gap={2} textAlign="center" mb={8}>
          <Flex
            h={14}
            w={14}
            alignItems="center"
            justifyContent="center"
            borderRadius="xl"
            bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
            mb={2}
          >
            <Box as={FiPackage} w={7} h={7} color="white" />
          </Flex>
          <Heading as="h1" size="xl" color="gray.900" fontWeight="bold">
            ReHub
          </Heading>
          <Heading
            as="h2"
            size="md"
            color="gray.700"
            fontWeight="semibold"
            mt={4}
          >
            Xác thực Email
          </Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Chúng tôi đã gửi một email xác thực đến bạn
          </Text>
        </VStack>

        {/* Form */}
        <Box bg="white" py={8} px={6} boxShadow="md" borderRadius="xl">
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
