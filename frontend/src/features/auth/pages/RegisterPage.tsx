import { useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Box,
  Container,
  Heading,
  Text,
  Link as ChakraLink,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { FiPackage } from "react-icons/fi";
import { getAccessToken } from "@/features/auth/utils/auth.storage";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export function RegisterPage() {
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (getAccessToken()) {
      navigate({ to: "/" });
    }
  }, [navigate]);

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
            bgGradient="linear(to-br, blue.600, purple.600)"
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
            Tạo tài khoản
          </Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Hoặc{" "}
            <ChakraLink
              asChild
              color="blue.600"
              fontWeight="medium"
              _hover={{ color: "blue.700" }}
            >
              <Link to="/auth/login">đăng nhập nếu đã có tài khoản</Link>
            </ChakraLink>
          </Text>
        </VStack>

        {/* Form */}
        <Box bg="white" py={8} px={6} boxShadow="md" borderRadius="xl">
          <RegisterForm />
        </Box>

        {/* Footer */}
        <Text textAlign="center" fontSize="xs" color="gray.500" mt={8}>
          Bằng cách đăng ký, bạn đồng ý với{" "}
          <ChakraLink href="#" color="gray.700" _hover={{ color: "gray.900" }}>
            Điều khoản dịch vụ
          </ChakraLink>{" "}
          và{" "}
          <ChakraLink href="#" color="gray.700" _hover={{ color: "gray.900" }}>
            Chính sách bảo mật
          </ChakraLink>
        </Text>
      </Container>
    </Box>
  );
}
