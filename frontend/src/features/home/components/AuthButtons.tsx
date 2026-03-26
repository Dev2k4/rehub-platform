import { Link } from "@tanstack/react-router";
import { HStack, Button, Link as ChakraLink } from "@chakra-ui/react";

export function AuthButtons() {
  return (
    <HStack gap={2}>
      <ChakraLink asChild>
        <Link to="/auth/login">
          <Button
            variant="ghost"
            size="sm"
            color="blue.600"
            _hover={{ bg: "blue.50" }}
            fontWeight="medium"
          >
            Đăng nhập
          </Button>
        </Link>
      </ChakraLink>
      <ChakraLink asChild>
        <Link to="/auth/register">
          <Button
            size="sm"
            bg="blue.600"
            color="white"
            _hover={{ bg: "blue.700" }}
            fontWeight="medium"
            borderRadius="md"
          >
            Đăng ký
          </Button>
        </Link>
      </ChakraLink>
    </HStack>
  );
}
