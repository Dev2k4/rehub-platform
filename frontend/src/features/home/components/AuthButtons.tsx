import { Link } from "@tanstack/react-router"
import { HStack, Button, Link as ChakraLink } from "@chakra-ui/react"

export function AuthButtons() {
  return (
    <HStack gap={2}>
      <ChakraLink asChild>
        <Link to="/auth/login">
          <Button
            variant="ghost"
            colorScheme="blue"
            size="sm"
          >
            Đăng nhập
          </Button>
        </Link>
      </ChakraLink>
      <ChakraLink asChild>
        <Link to="/auth/register">
          <Button
            colorScheme="blue"
            size="sm"
          >
            Đăng ký
          </Button>
        </Link>
      </ChakraLink>
    </HStack>
  )
}
