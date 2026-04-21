import {
  Box,
  Link as ChakraLink,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { FiArrowRight } from "react-icons/fi"
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout"
import { LoginForm } from "@/features/auth/components/LoginForm"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

export function LoginPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (getAccessToken()) {
      navigate({ to: "/" })
    }
  }, [navigate])

  return (
    <AuthPageLayout backTo="/" backLabel="Về trang chủ">
      <VStack align="flex-start" gap={1} mb={8}>
        <Heading
          fontSize="1.75rem"
          fontWeight="900"
          color="gray.900"
          letterSpacing="-0.02em"
        >
          Đăng nhập
        </Heading>
        <Text fontSize="sm" color="gray.500">
          Chào mừng bạn trở lại với{" "}
          <Text as="span" color="blue.600" fontWeight="700">
            ReHub
          </Text>
          ! 👋
        </Text>
      </VStack>

      <LoginForm />

      <Box mt={4} textAlign="right">
        <ChakraLink
          asChild
          fontSize="xs"
          color="gray.400"
          _hover={{ color: "blue.500" }}
        >
          <Link to="/auth/forgot-password">Quên mật khẩu?</Link>
        </ChakraLink>
      </Box>

      <Box
        mt={8}
        pt={6}
        borderTop="1px solid"
        borderColor="gray.100"
        textAlign="center"
      >
        <Text fontSize="sm" color="gray.500">
          Chưa có tài khoản?{" "}
          <ChakraLink
            asChild
            color="blue.600"
            fontWeight="700"
            _hover={{ color: "blue.700" }}
          >
            <Link to="/auth/register">
              Đăng ký miễn phí <Box as={FiArrowRight} display="inline" />
            </Link>
          </ChakraLink>
        </Text>
      </Box>
    </AuthPageLayout>
  )
}
