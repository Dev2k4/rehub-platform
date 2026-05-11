import { Box, Flex, Heading, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"

const slides = [
  {
    gradient: "linear-gradient(135deg, #02457A 0%, #018ABE 60%, #0EA5E9 100%)",
    eyebrow: "ReHub Marketplace",
    title: "Trao đổi đồ cũ,\nLan tỏa giá trị mới.",
    subtitle:
      "Hàng nghìn sản phẩm chất lượng từ người bán uy tín trên toàn quốc.",
    emoji: "♻️",
    decorEmojis: ["📦", "🏷️", "✅"],
  },
  {
    gradient: "linear-gradient(135deg, #7C3AED 0%, #A855F7 60%, #EC4899 100%)",
    eyebrow: "Mua sắm thông minh",
    title: "Tiết kiệm hơn\nvới đồ secondhand.",
    subtitle: "Tìm kiếm deal tốt, tiết kiệm đến 80% so với giá gốc.",
    emoji: "💸",
    decorEmojis: ["💰", "🎁", "⚡"],
  },
  {
    gradient: "linear-gradient(135deg, #059669 0%, #10B981 60%, #34D399 100%)",
    eyebrow: "Bền vững & Xanh",
    title: "Mua bán có trách nhiệm,\nbảo vệ môi trường.",
    subtitle: "Mỗi sản phẩm secondhand giúp giảm rác thải & bảo vệ hành tinh.",
    emoji: "🌿",
    decorEmojis: ["🌍", "♻️", "💚"],
  },
]

export function HeroBannerCarousel() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true)
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length)
        setAnimating(false)
      }, 300)
    }, 4500)
    return () => clearInterval(timer)
  }, [])

  const goTo = (idx: number) => {
    if (idx === current) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(idx)
      setAnimating(false)
    }, 300)
  }

  const slide = slides[current]

  return (
    <Box
      position="relative"
      borderRadius="1.5rem"
      overflow="hidden"
      mb="2rem"
      boxShadow="0 20px 60px rgba(0,0,0,0.15)"
      style={{ background: slide.gradient }}
      transition="background 0.6s ease"
    >
      {/* Decorative blobs */}
      <Box
        position="absolute"
        top="-30%"
        right="-5%"
        w="320px"
        h="320px"
        borderRadius="50%"
        bg="whiteAlpha.100"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="-20%"
        left="40%"
        w="200px"
        h="200px"
        borderRadius="50%"
        bg="whiteAlpha.100"
        pointerEvents="none"
      />

      <Flex
        px={{ base: "1.5rem", md: "4%" }}
        py={{ base: "2rem", md: "3rem" }}
        align="center"
        justify="space-between"
        minH={{ base: "180px", md: "220px" }}
        position="relative"
        zIndex={1}
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        <Box>
          <Text
            fontSize={{ base: "0.65rem", md: "0.75rem" }}
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="whiteAlpha.800"
            fontWeight="800"
            mb="0.5rem"
          >
            {slide.eyebrow}
          </Text>
          <Heading
            as="h1"
            fontSize={{ base: "1.5rem", md: "2.625rem" }}
            fontWeight="900"
            lineHeight="1.15"
            color="white"
            whiteSpace="pre-line"
            textShadow="0 2px 10px rgba(0,0,0,0.15)"
            mb="0.75rem"
          >
            {slide.title}
          </Heading>
          <Text
            fontSize={{ base: "0.8rem", md: "1rem" }}
            color="whiteAlpha.900"
            fontWeight="500"
            maxW="520px"
          >
            {slide.subtitle}
          </Text>
        </Box>

        {/* Big emoji on the right */}
        <Flex
          direction="column"
          align="center"
          gap="0.75rem"
          display={{ base: "none", md: "flex" }}
          flexShrink={0}
          ml="2rem"
        >
          <Box
            fontSize="5rem"
            lineHeight="1"
            style={{
              filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.2))",
              animation: "float 3s ease-in-out infinite",
            }}
          >
            {slide.emoji}
          </Box>
          <Flex gap="0.75rem">
            {slide.decorEmojis.map((e, i) => (
              <Box
                key={i}
                fontSize="1.5rem"
                bg="whiteAlpha.200"
                borderRadius="0.75rem"
                p="0.5rem"
                style={{ animationDelay: `${i * 0.3}s` }}
              >
                {e}
              </Box>
            ))}
          </Flex>
        </Flex>
      </Flex>

      {/* Dot navigation */}
      <Flex
        position="absolute"
        bottom="1rem"
        left="50%"
        transform="translateX(-50%)"
        gap="0.4rem"
        zIndex={2}
      >
        {slides.map((_, i) => (
          <Box
            key={i}
            as="button"
            w={i === current ? "1.5rem" : "0.5rem"}
            h="0.5rem"
            borderRadius="999px"
            bg={i === current ? "white" : "whiteAlpha.500"}
            border="none"
            cursor="pointer"
            transition="all 0.3s ease"
            onClick={() => goTo(i)}
            aria-label={`Chuyển đến slide ${i + 1}`}
          />
        ))}
      </Flex>
    </Box>
  )
}
