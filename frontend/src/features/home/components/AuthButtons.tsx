import { Button, Link as ChakraLink, HStack } from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";

export function AuthButtons() {
  return (
    <HStack gap={2}>
      <ChakraLink asChild>
        <Link to="/auth/login">
          <Button
            variant="outline"
            size="sm"
            color="gray.700"
            bg="whiteAlpha.600"
            backdropFilter="blur(8px)"
            borderColor="whiteAlpha.400"
            _hover={{
              bg: "whiteAlpha.800",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              transform: "translateY(-1px)",
            }}
            fontWeight="medium"
            transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            Đăng nhập
          </Button>
        </Link>
      </ChakraLink>
      <ChakraLink asChild>
        <Link to="/auth/register">
          <Button
            size="sm"
            bg="linear-gradient(135deg, #02457A 0%, #018ABE 100%)"
            color="white"
            _hover={{
              bg: "linear-gradient(135deg, #013A67 0%, #017AAA 100%)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 15px rgba(2,69,122,0.4)",
            }}
            fontWeight="medium"
            borderRadius="full"
            transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            Đăng ký
          </Button>
        </Link>
      </ChakraLink>
    </HStack>
  );
}
