import {
  Box,
  Link as ChakraLink,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { FiArrowLeft } from "react-icons/fi"
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout"
import { RegisterForm } from "@/features/auth/components/RegisterForm"
import { getAccessToken } from "@/features/auth/utils/auth.storage"

export function RegisterPage() {
  const navigate = useNavigate()

  useEffect(() => {
    if (getAccessToken()) {
      navigate({ to: "/" })
    }
  }, [navigate])

  return (
    <AuthPageLayout backTo="/" backLabel="Về trang chủ">
      <VStack align="flex-start" gap={1} mb={6}>
        <Heading
          fontSize="1.75rem"
          fontWeight="900"
          color="gray.900"
          letterSpacing="-0.02em"
        >
          Tạo tài khoản
        </Heading>
        <Text fontSize="sm" color="gray.500">
          Tham gia cộng đồng{" "}
          <Text as="span" color="blue.600" fontWeight="700">
            ReHub
          </Text>{" "}
          ngay hôm nay 🚀
        </Text>
      </VStack>

      <RegisterForm />

      <Text fontSize="xs" color="gray.400" textAlign="center" mt={4} px={2}>
        Bằng cách đăng ký, bạn đồng ý với{" "}
        <ChakraLink href="#" color="gray.600" _hover={{ color: "blue.600" }}>
          Điều khoản dịch vụ
        </ChakraLink>{" "}
        và{" "}
        <ChakraLink href="#" color="gray.600" _hover={{ color: "blue.600" }}>
          Chính sách bảo mật
        </ChakraLink>
      </Text>

      <Box
        mt={6}
        pt={5}
        borderTop="1px solid"
        borderColor="gray.100"
        textAlign="center"
      >
        <Text fontSize="sm" color="gray.500">
          Đã có tài khoản?{" "}
          <ChakraLink
            asChild
            color="blue.600"
            fontWeight="700"
            _hover={{ color: "blue.700" }}
          >
            <Link to="/auth/login">
              <Box as={FiArrowLeft} display="inline" mr={1} />
              Đăng nhập ngay
            </Link>
          </ChakraLink>
        </Text>
      </Box>
    </AuthPageLayout>
  )
}
