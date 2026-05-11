/**
 * AuthPageLayout – shared premium layout for all auth pages.
 * Left panel: animated gradient with floating feature badges (desktop only)
 * Right panel: scrollable form panel with glassmorphism card
 * Includes a back button at the top-left of the form panel.
 */
import { Box, Flex, Heading, Text } from "@chakra-ui/react"
import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"
import {
  FiArrowLeft,
  FiShield,
  FiShoppingBag,
  FiStar,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi"

const FEATURES = [
  { icon: FiShoppingBag, label: "Mua bán dễ dàng", emoji: "🛍️" },
  { icon: FiShield, label: "Thanh toán an toàn", emoji: "🔒" },
  { icon: FiStar, label: "Đánh giá uy tín", emoji: "⭐" },
  { icon: FiTrendingUp, label: "Thương lượng linh hoạt", emoji: "💬" },
  { icon: FiUsers, label: "Cộng đồng lớn mạnh", emoji: "👥" },
  { icon: FiArrowLeft, label: "Tái sử dụng bền vững", emoji: "♻️" },
]

const BADGE_POSITIONS: React.CSSProperties[] = [
  { top: "10%", left: "5%" },
  { top: "7%", right: "8%" },
  { top: "40%", left: "3%" },
  { top: "60%", right: "6%" },
  { bottom: "22%", left: "6%" },
  { bottom: "10%", right: "5%" },
]

type AuthPageLayoutProps = {
  children: ReactNode
  /** Where the back button navigates to. Defaults to "/" */
  backTo?: string
  backLabel?: string
}

export function AuthPageLayout({
  children,
  backTo = "/",
  backLabel = "Về trang chủ",
}: AuthPageLayoutProps) {
  return (
    <Flex minH="100vh" overflow="hidden">
      {/* ───────── LEFT PANEL ───────── */}
      <Box
        display={{ base: "none", lg: "flex" }}
        flex="1"
        flexDirection="column"
        justifyContent="space-between"
        p={12}
        position="relative"
        overflow="hidden"
        style={{
          background:
            "linear-gradient(135deg, #02457A 0%, #0369A1 50%, #018ABE 100%)",
        }}
      >
        {/* Animated gradient orbs */}
        <Box
          position="absolute"
          top="-100px"
          left="-100px"
          w="400px"
          h="400px"
          borderRadius="full"
          bg="whiteAlpha.100"
          filter="blur(80px)"
          style={{ animation: "float 8s ease-in-out infinite" }}
        />
        <Box
          position="absolute"
          bottom="-120px"
          right="-80px"
          w="500px"
          h="500px"
          borderRadius="full"
          bg="whiteAlpha.100"
          filter="blur(100px)"
          style={{ animation: "float 12s ease-in-out infinite reverse" }}
        />
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="300px"
          h="300px"
          borderRadius="full"
          bg="whiteAlpha.50"
          filter="blur(60px)"
        />

        {/* Floating feature badges */}
        {FEATURES.map((f, i) => (
          <Box
            key={f.label}
            position="absolute"
            style={{ ...BADGE_POSITIONS[i], animationDelay: `${i * 0.5}s` }}
            bg="rgba(255,255,255,0.12)"
            backdropFilter="blur(16px)"
            border="1px solid rgba(255,255,255,0.25)"
            borderRadius="2xl"
            px={4}
            py={3}
            display="flex"
            alignItems="center"
            gap={2}
            boxShadow="0 8px 32px rgba(0,0,0,0.1)"
            className="animate-fadeinup"
          >
            <Box as="span" fontSize="1rem">
              {f.emoji}
            </Box>
            <Text fontSize="xs" color="white" fontWeight="600">
              {f.label}
            </Text>
          </Box>
        ))}

        {/* Center branding */}
        <Flex
          flex={1}
          direction="column"
          align="center"
          justify="center"
          zIndex={1}
          position="relative"
        >
          {/* Logo */}
          <Box
            w="5rem"
            h="5rem"
            borderRadius="2xl"
            bg="rgba(255,255,255,0.15)"
            backdropFilter="blur(20px)"
            border="1px solid rgba(255,255,255,0.3)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mb={6}
            boxShadow="0 20px 60px rgba(0,0,0,0.2)"
            style={{ animation: "float 4s ease-in-out infinite" }}
          >
            <Box fontSize="2.5rem" lineHeight="1">
              ♻️
            </Box>
          </Box>
          <Heading
            fontSize="4xl"
            fontWeight="900"
            color="white"
            letterSpacing="-0.02em"
            mb={3}
          >
            ReHub
          </Heading>
          <Text
            fontSize="sm"
            color="whiteAlpha.800"
            letterSpacing="0.15em"
            textTransform="uppercase"
            fontWeight="600"
            textAlign="center"
          >
            Nền tảng mua bán đồ cũ uy tín
          </Text>

          {/* Stats row */}
          <Flex gap={6} mt={10}>
            {[
              { num: "10K+", label: "Tin đăng" },
              { num: "5K+", label: "Người dùng" },
              { num: "98%", label: "Hài lòng" },
            ].map((stat) => (
              <Box key={stat.label} textAlign="center">
                <Text fontSize="xl" fontWeight="800" color="white">
                  {stat.num}
                </Text>
                <Text fontSize="xs" color="whiteAlpha.700" fontWeight="500">
                  {stat.label}
                </Text>
              </Box>
            ))}
          </Flex>
        </Flex>

        {/* Footer */}
        <Text
          fontSize="xs"
          color="whiteAlpha.500"
          textAlign="center"
          zIndex={1}
          position="relative"
        >
          © 2025 ReHub Platform · All rights reserved
        </Text>
      </Box>

      {/* ───────── RIGHT PANEL ───────── */}
      <Flex
        flex="1"
        direction="column"
        justify="center"
        align="center"
        position="relative"
        overflowY="auto"
        py={10}
        px={{ base: 4, md: 10 }}
        style={{
          background:
            "linear-gradient(160deg, #EFF6FF 0%, #F0F9FF 50%, #F8FAFC 100%)",
        }}
      >
        {/* Back button */}
        <Box position="absolute" top="1.5rem" left="1.5rem">
          <Link
            to={backTo}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.82rem",
              fontWeight: "600",
              color: "#6B7280",
              background: "white",
              padding: "0.45rem 0.875rem",
              borderRadius: "999px",
              border: "1px solid #E5E7EB",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              textDecoration: "none",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.color = "#2563EB"
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
                "#BFDBFE"
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                "0 4px 12px rgba(59,130,246,0.15)"
              ;(e.currentTarget as HTMLAnchorElement).style.transform =
                "translateX(-2px)"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLAnchorElement).style.color = "#6B7280"
              ;(e.currentTarget as HTMLAnchorElement).style.borderColor =
                "#E5E7EB"
              ;(e.currentTarget as HTMLAnchorElement).style.boxShadow =
                "0 1px 4px rgba(0,0,0,0.06)"
              ;(e.currentTarget as HTMLAnchorElement).style.transform = "none"
            }}
          >
            <FiArrowLeft size={14} />
            {backLabel}
          </Link>
        </Box>

        {/* Mobile logo */}
        <Box
          display={{ base: "flex", lg: "none" }}
          flexDirection="column"
          alignItems="center"
          mb={6}
        >
          <Box
            w="3rem"
            h="3rem"
            borderRadius="1rem"
            style={{
              background: "linear-gradient(135deg, #02457A 0%, #018ABE 100%)",
            }}
            display="flex"
            alignItems="center"
            justifyContent="center"
            mb={2}
            fontSize="1.5rem"
          >
            ♻️
          </Box>
          <Text
            fontSize="lg"
            fontWeight="900"
            color="blue.800"
            letterSpacing="-0.02em"
          >
            ReHub
          </Text>
        </Box>

        {/* Form card */}
        <Box
          w="full"
          maxW="460px"
          bg="white"
          p={{ base: 6, md: 9 }}
          borderRadius="1.5rem"
          boxShadow="0 20px 60px -10px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)"
          position="relative"
          className="animate-fadeinup"
        >
          {/* Top accent bar */}
          <Box
            position="absolute"
            top={0}
            left="10%"
            right="10%"
            h="3px"
            borderBottomRadius="full"
            style={{
              background: "linear-gradient(90deg, #02457A, #018ABE, #38BDF8)",
            }}
          />
          {children}
        </Box>


      </Flex>
    </Flex>
  )
}
