import {
  Box,
  Link as ChakraLink,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import { FiMail } from "react-icons/fi"
import { AuthPageLayout } from "@/features/auth/components/AuthPageLayout"
import { VerifyEmailForm } from "@/features/auth/components/VerifyEmailForm"

export function VerifyEmailPage() {
  return (
    <AuthPageLayout backTo="/auth/login" backLabel="Về trang đăng nhập">
      {/* Header */}
      <VStack align="center" gap={3} mb={8}>
        {/* Email icon */}
        <Box
          w="4rem"
          h="4rem"
          borderRadius="1.25rem"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="2rem"
          style={{
            background: "linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 100%)",
            boxShadow: "0 8px 24px rgba(59,130,246,0.15)",
          }}
        >
          <Box as={FiMail} color="blue.600" w={8} h={8} />
        </Box>
        <Heading
          fontSize="1.5rem"
          fontWeight="900"
          color="gray.900"
          textAlign="center"
          letterSpacing="-0.02em"
        >
          Xác thực Email
        </Heading>
        <Text fontSize="sm" color="gray.500" textAlign="center" maxW="320px">
          Chúng tôi đã gửi một email xác thực đến bạn. Vui lòng kiểm tra hộp thư
          và nhập mã bên dưới.
        </Text>
      </VStack>

      <VerifyEmailForm />

      <Box
        mt={8}
        pt={6}
        borderTop="1px solid"
        borderColor="gray.100"
        textAlign="center"
      >
        <Text fontSize="sm" color="gray.500">
          Gặp vấn đề?{" "}
          <ChakraLink
            asChild
            color="blue.600"
            fontWeight="600"
            _hover={{ color: "blue.700" }}
          >
            <Link to="/auth/login">Quay lại đăng nhập</Link>
          </ChakraLink>
        </Text>
      </Box>
    </AuthPageLayout>
  )
}
