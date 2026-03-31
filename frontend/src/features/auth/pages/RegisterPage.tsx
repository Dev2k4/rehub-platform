import {
  Box,
  Flex,
  Heading,
  Link as ChakraLink,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { getAccessToken } from "@/features/auth/utils/auth.storage";

const FEATURES = [
  { icon: FiShoppingBag, label: "Mua bán dễ dàng" },
  { icon: FiShield, label: "Thanh toán an toàn" },
  { icon: FiStar, label: "Đánh giá uy tín" },
  { icon: FiTrendingUp, label: "Thương lượng linh hoạt" },
  { icon: FiUsers, label: "Cộng đồng lớn mạnh" },
  { icon: FiRefreshCw, label: "Tái sử dụng bền vững" },
];

export function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getAccessToken()) {
      navigate({ to: "/" });
    }
  }, [navigate]);

  return (
    <Flex minH="100vh">
      {/* LEFT PANEL – Branded gradient */}
      <Box
        display={{ base: "none", lg: "flex" }}
        flex="1"
        flexDirection="column"
        justifyContent="space-between"
        p={12}
        position="relative"
        overflow="hidden"
        bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
      >
        {/* Decorative blobs */}
        <Box
          position="absolute"
          top="-80px"
          left="-80px"
          w="320px"
          h="320px"
          borderRadius="full"
          bg="whiteAlpha.100"
          filter="blur(60px)"
        />
        <Box
          position="absolute"
          bottom="-100px"
          right="-60px"
          w="400px"
          h="400px"
          borderRadius="full"
          bg="whiteAlpha.100"
          filter="blur(80px)"
        />
        {/* Floating feature badges */}
        {FEATURES.map((f, i) => {
          const positions = [
            { top: "12%", left: "6%" },
            { top: "8%", right: "10%" },
            { top: "42%", left: "3%" },
            { top: "62%", right: "8%" },
            { bottom: "20%", left: "8%" },
            { bottom: "12%", right: "6%" },
          ];
          return (
            <Box
              key={f.label}
              position="absolute"
              style={positions[i]}
              bg="whiteAlpha.200"
              backdropFilter="blur(12px)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              borderRadius="2xl"
              px={4}
              py={3}
              display="flex"
              alignItems="center"
              gap={2}
            >
              <Box as={f.icon} color="white" boxSize={4} />
              <Text fontSize="xs" color="white" fontWeight="semibold">
                {f.label}
              </Text>
            </Box>
          );
        })}

        {/* Center branding */}
        <Flex
          flex={1}
          direction="column"
          align="center"
          justify="center"
          zIndex={1}
          position="relative"
        >
          <Box
            w={20}
            h={20}
            borderRadius="2xl"
            bg="whiteAlpha.200"
            backdropFilter="blur(20px)"
            border="1px solid"
            borderColor="whiteAlpha.400"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mb={6}
            boxShadow="0 20px 60px rgba(0,0,0,0.15)"
          >
            <Box as={FiRefreshCw} boxSize={9} color="white" />
          </Box>
          <Heading
            fontSize="4xl"
            fontWeight="extrabold"
            color="white"
            letterSpacing="tight"
            mb={3}
          >
            ReHub
          </Heading>
          <Text
            fontSize="sm"
            color="whiteAlpha.800"
            letterSpacing="widest"
            textTransform="uppercase"
            fontWeight="semibold"
          >
            Nền tảng mua bán đồ cũ uy tín
          </Text>
        </Flex>

        {/* Bottom note */}
        <Text
          fontSize="xs"
          color="whiteAlpha.600"
          textAlign="center"
          zIndex={1}
          position="relative"
        >
          © 2025 ReHub Platform · All rights reserved
        </Text>
      </Box>

      {/* RIGHT PANEL – Form */}
      <Flex
        flex={{ base: 1, lg: "0 0 540px" }}
        maxW={{ base: "full", lg: "540px" }}
        direction="column"
        justify="center"
        align="center"
        bg="#F0F4F8"
        px={{ base: 4, md: 8 }}
        py={12}
        position="relative"
        overflowY="auto"
      >
        <Box
          w="full"
          maxW="420px"
          bg="white"
          p={{ base: 8, md: 10 }}
          borderRadius="2xl"
          boxShadow="0 10px 40px -10px rgba(0,0,0,0.1)"
          border="1px solid"
          borderColor="gray.100"
        >
          {/* Logo mark – mobile only */}
          <Box
            display={{ base: "flex", lg: "none" }}
            w={12}
            h={12}
            borderRadius="xl"
            bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
            alignItems="center"
            justifyContent="center"
            mb={6}
            mx="auto"
          >
            <Box as={FiRefreshCw} boxSize={6} color="white" />
          </Box>

          <VStack align="flex-start" gap={1} mb={8}>
            <Heading fontSize="2xl" fontWeight="bold" color="gray.900">
              Tạo tài khoản
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Tham gia cộng đồng{" "}
              <Text as="span" color="blue.600" fontWeight="semibold">
                ReHub
              </Text>{" "}
              ngay hôm nay
            </Text>
          </VStack>

          <RegisterForm />

          <Text fontSize="sm" color="gray.500" textAlign="center" mt={8}>
            Đã có tài khoản?{" "}
            <ChakraLink
              asChild
              color="blue.600"
              fontWeight="semibold"
              _hover={{ color: "blue.700" }}
            >
              <Link to="/auth/login">
                <Box as={FiArrowLeft} display="inline" mr={1} />
                Đăng nhập ngay
              </Link>
            </ChakraLink>
          </Text>

          <Text fontSize="xs" color="gray.400" textAlign="center" mt={4}>
            Bằng cách đăng ký, bạn đồng ý với{" "}
            <ChakraLink
              href="#"
              color="gray.600"
              _hover={{ color: "gray.800" }}
            >
              Điều khoản dịch vụ
            </ChakraLink>{" "}
            và{" "}
            <ChakraLink
              href="#"
              color="gray.600"
              _hover={{ color: "gray.800" }}
            >
              Chính sách bảo mật
            </ChakraLink>
          </Text>
        </Box>
      </Flex>
    </Flex>
  );
}
