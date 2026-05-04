import {
  Box,
  Container,
  Flex,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Icon,
  Separator,
} from "@chakra-ui/react"
import { Link, useRouterState } from "@tanstack/react-router"
import { useEffect } from "react"
import {
  FiFacebook,
  FiInstagram,
  FiMessageSquare,
  FiRefreshCcw,
  FiMail,
  FiArrowRight,
} from "react-icons/fi"

const FooterLink = ({ to, children, href }: { to?: string; children: React.ReactNode; href?: string }) => {
  const content = (
    <HStack gap={1} transition="all 0.2s" color="whiteAlpha.600" _hover={{ color: "blue.400", transform: "translateX(4px)" }} cursor="pointer">
      <Icon as={FiArrowRight} boxSize={3} opacity={0} _groupHover={{ opacity: 1 }} />
      <Text fontSize="sm" fontWeight="500">{children}</Text>
    </HStack>
  );

  if (to) {
    return (
      <Link to={to} style={{ textDecoration: "none" }} className="group">
        {content}
      </Link>
    );
  }

  return (
    <a href={href} style={{ textDecoration: "none" }} className="group">
      {content}
    </a>
  );
};

const SocialButton = ({ icon: IconNode, href, color }: { icon: any; href: string; color: string }) => (
  <Box
    as="a"
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    w={9}
    h={9}
    borderRadius="full"
    display="flex"
    alignItems="center"
    justifyContent="center"
    bg="whiteAlpha.100"
    color="whiteAlpha.700"
    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    _hover={{
      bg: color,
      color: "white",
      transform: "translateY(-4px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
    }}
  >
    <IconNode size={16} />
  </Box>
);

export function Footer() {
  const { location } = useRouterState();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <Box
      as="footer"
      bg="gray.950"
      color="white"
      mt={12}
      position="relative"
      overflow="hidden"
      w="100%"
    >
      {/* Subtle Top Gradient Line */}
      <Box 
        h="2px" 
        w="full" 
        bgGradient="to-r" 
        gradientFrom="blue.500" 
        gradientVia="purple.500" 
        gradientTo="orange.400"
        opacity={0.8}
      />

      <Container maxW="100%" px="4%" py={10}>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 12 }} gap={{ base: 10, lg: 12 }}>
          {/* Brand Column */}
          <Box gridColumn={{ base: "span 1", lg: "span 5" }}>
            <VStack align="start" gap={4}>
              <Flex align="center" gap={3}>
                <Box 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="center" 
                  bgGradient="to-br" 
                  gradientFrom="blue.500" 
                  gradientTo="blue.700"
                  p={1.5} 
                  borderRadius="lg"
                  boxShadow="0 4px 12px rgba(37, 99, 235, 0.3)"
                >
                  <Icon as={FiRefreshCcw} boxSize={5} color="white" />
                </Box>
                <Text
                  fontWeight="900"
                  fontSize="xl"
                  bgGradient="to-r"
                  gradientFrom="white"
                  gradientTo="whiteAlpha.800"
                  bgClip="text"
                  letterSpacing="tight"
                >
                  ReHub
                </Text>
              </Flex>
              
              <Text
                fontSize="sm"
                color="whiteAlpha.700"
                lineHeight={1.7}
                maxW="400px"
              >
                Sàn giao dịch đồ cũ uy tín hàng đầu Việt Nam. Nơi kết nối cộng đồng yêu thích đồ cũ, 
                lan tỏa giá trị bền vững và tiết kiệm tối đa cho mọi nhà.
              </Text>

              <HStack gap={3} mt={1}>
                <SocialButton icon={FiFacebook} href="https://facebook.com" color="#1877F2" />
                <SocialButton icon={FiInstagram} href="https://instagram.com" color="#E4405F" />
                <SocialButton icon={FiMessageSquare} href="/" color="#0084FF" />
              </HStack>
            </VStack>
          </Box>

          {/* Links Column 1 */}
          <Box gridColumn={{ base: "span 1", lg: "span 3" }}>
            <VStack align="start" gap={4}>
              <Text
                fontWeight="800"
                fontSize="xs"
                color="white"
                textTransform="uppercase"
                letterSpacing="widest"
              >
                Liên kết nhanh
              </Text>
              <VStack align="start" gap={3} w="full">
                <FooterLink to="/">Trang chủ</FooterLink>
                <FooterLink to="/my-listings">Đăng tin bán</FooterLink>
                <FooterLink to="/orders">Đơn hàng của tôi</FooterLink>
                <FooterLink to="/wallet">Ví của tôi</FooterLink>
              </VStack>
            </VStack>
          </Box>

          {/* Links Column 2 */}
          <Box gridColumn={{ base: "span 1", lg: "span 4" }}>
            <VStack align="start" gap={4}>
              <Text
                fontWeight="800"
                fontSize="xs"
                color="white"
                textTransform="uppercase"
                letterSpacing="widest"
              >
                Hỗ trợ khách hàng
              </Text>
              <VStack align="start" gap={3} w="full">
                <HStack color="whiteAlpha.600" _hover={{ color: "blue.400" }} transition="all 0.2s" cursor="pointer" as="a" href="mailto:support@rehub.vn">
                  <FiMail />
                  <Text fontSize="sm" fontWeight="500">support@rehub.vn</Text>
                </HStack>
                <FooterLink href="/">Hướng dẫn mua bán</FooterLink>
                <FooterLink href="/">Điều khoản sử dụng</FooterLink>
                <FooterLink href="/">Chính sách bảo mật</FooterLink>
              </VStack>
            </VStack>
          </Box>
        </SimpleGrid>

        <Separator mt={10} borderColor="whiteAlpha.100" />

        {/* Bottom Bar */}
        <Flex
          mt={8}
          justify={{ base: "center", md: "space-between" }}
          align="center"
          direction={{ base: "column", md: "row" }}
          gap={4}
        >
          <VStack align={{ base: "center", md: "start" }} gap={0.5}>
            <Text fontSize="xs" color="whiteAlpha.500" fontWeight="500">
              © {new Date().getFullYear()} ReHub Marketplace. Bảo lưu mọi quyền.
            </Text>
            <Text fontSize="10px" color="whiteAlpha.300">
              Phát triển bởi đội ngũ ReHub Team với ❤️ tại Việt Nam
            </Text>
          </VStack>

          <HStack gap={2} bg="whiteAlpha.50" px={3} py={1.5} borderRadius="full" border="1px solid" borderColor="whiteAlpha.100">
            <Icon as={FiRefreshCcw} boxSize={3} color="blue.400" />
            <Text fontSize="10px" color="whiteAlpha.600" fontWeight="600" letterSpacing="wide">
              NỀN TẢNG ĐỒ CŨ – LAN TỎA GIÁ TRỊ MỚI
            </Text>
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}
