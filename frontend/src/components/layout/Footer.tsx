import {
  Box,
  Container,
  Flex,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import {
  FiFacebook,
  FiInstagram,
  FiMessageSquare,
  FiRefreshCcw,
} from "react-icons/fi"

const linkStyle = {
  fontSize: "0.875rem",
  color: "rgba(255,255,255,0.65)",
  textDecoration: "none",
  transition: "color 0.2s",
}

export function Footer() {
  return (
    <Box
      as="footer"
      bg="gray.900"
      color="whiteAlpha.800"
      mt={16}
      borderTop="1px solid"
      borderColor="whiteAlpha.100"
    >
      <Container maxW="7xl" px={{ base: 4, md: 8 }} py={12}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={10}>
          {/* Cột 1: Về ReHub */}
          <VStack align="start" gap={4}>
            <Flex align="center" gap={2}>
              <Box as={FiRefreshCcw} w={5} h={5} color="blue.400" />
              <Text
                fontWeight="800"
                fontSize="lg"
                color="white"
                letterSpacing="tight"
              >
                ReHub
              </Text>
            </Flex>
            <Text
              fontSize="sm"
              color="whiteAlpha.700"
              lineHeight={1.8}
              maxW="260px"
            >
              Sàn giao dịch đồ cũ uy tín hàng đầu Việt Nam. Mua bán nhanh –
              Thanh toán bảo mật – Giao hàng toàn quốc.
            </Text>
            <Flex gap={4} mt={2}>
              {[
                {
                  icon: FiFacebook,
                  href: "https://facebook.com",
                  hoverColor: "#63B3ED",
                },
                {
                  icon: FiInstagram,
                  href: "https://instagram.com",
                  hoverColor: "#F687B3",
                },
                {
                  icon: FiMessageSquare,
                  href: "/",
                  hoverColor: "#68D391",
                },
              ].map(({ icon: Icon, href, hoverColor }, i) => (
                <a
                  key={i}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href.startsWith("http") ? "noopener noreferrer" : undefined
                  }
                  style={{
                    color: "rgba(255,255,255,0.65)",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = hoverColor)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255,255,255,0.65)")
                  }
                >
                  <Icon size={20} />
                </a>
              ))}
            </Flex>
          </VStack>

          {/* Cột 2: Liên kết nhanh */}
          <VStack align="start" gap={3}>
            <Text
              fontWeight="700"
              fontSize="xs"
              color="white"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={1}
            >
              Liên kết nhanh
            </Text>
            {[
              { label: "Trang chủ", to: "/" },
              { label: "Đăng tin bán", to: "/my-listings" },
              { label: "Đơn hàng của tôi", to: "/orders" },
              { label: "Ví của tôi", to: "/wallet" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                style={linkStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#63B3ED")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.65)")
                }
              >
                {item.label}
              </Link>
            ))}
          </VStack>

          {/* Cột 3: Hỗ trợ */}
          <VStack align="start" gap={3}>
            <Text
              fontWeight="700"
              fontSize="xs"
              color="white"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={1}
            >
              Hỗ trợ
            </Text>
            {[
              {
                label: "Email: support@rehub.vn",
                href: "mailto:support@rehub.vn",
              },
              { label: "Hướng dẫn mua bán", href: "/" },
              { label: "Điều khoản sử dụng", href: "/" },
              { label: "Chính sách bảo mật", href: "/" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                style={linkStyle}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#63B3ED")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(255,255,255,0.65)")
                }
              >
                {item.label}
              </a>
            ))}
          </VStack>
        </SimpleGrid>

        {/* Divider + Copyright */}
        <Box mt={10} pt={6} borderTop="1px solid" borderColor="whiteAlpha.200">
          <Flex
            justify={{ base: "center", md: "space-between" }}
            align="center"
            direction={{ base: "column", md: "row" }}
            gap={3}
          >
            <Text fontSize="xs" color="whiteAlpha.500">
              © {new Date().getFullYear()} ReHub Marketplace. Bảo lưu mọi quyền.
            </Text>
            <Text fontSize="xs" color="whiteAlpha.400">
              Nền tảng mua bán đồ cũ – Lan tỏa giá trị mới ♻️
            </Text>
          </Flex>
        </Box>
      </Container>
    </Box>
  )
}
