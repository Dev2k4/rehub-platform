import {
  Toaster as ChakraToaster,
  Portal,
  Spinner,
  Stack,
  Toast,
  createToaster,
  Box,
} from "@chakra-ui/react";

export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
});

// Map palette token sang màu CSS thực tế (dùng cho boxShadow & bgGradient)
const GLOW_COLORS: Record<
  string,
  { glow: string; gradFrom: string; gradTo: string; bar: string }
> = {
  success: {
    glow: "rgba(34,197,94,0.35)",
    gradFrom: "#4ade80",
    gradTo: "#16a34a",
    bar: "#22c55e",
  },
  error: {
    glow: "rgba(239,68,68,0.35)",
    gradFrom: "#f87171",
    gradTo: "#dc2626",
    bar: "#ef4444",
  },
  warning: {
    glow: "rgba(249,115,22,0.35)",
    gradFrom: "#fb923c",
    gradTo: "#ea580c",
    bar: "#f97316",
  },
  info: {
    glow: "rgba(59,130,246,0.35)",
    gradFrom: "#60a5fa",
    gradTo: "#2563eb",
    bar: "#3b82f6",
  },
  loading: {
    glow: "rgba(59,130,246,0.35)",
    gradFrom: "#60a5fa",
    gradTo: "#2563eb",
    bar: "#3b82f6",
  },
};

const INDICATOR_COLORS: Record<string, string> = {
  success: "green.300",
  error: "red.300",
  warning: "orange.300",
  info: "blue.300",
  loading: "blue.300",
};

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => {
          const type = toast.type || "info";
          const colors = GLOW_COLORS[type] || GLOW_COLORS.info;

          return (
            <Toast.Root
              width={{ md: "sm" }}
              position="relative"
              overflow="hidden"
              display="flex"
              alignItems="flex-start"
              gap={3}
              bg="rgba(10, 15, 30, 0.88)"
              backdropFilter="blur(20px)"
              borderRadius="xl"
              border="1px solid"
              borderColor="rgba(255,255,255,0.10)"
              p={4}
              pl={5}
              boxShadow={`0 12px 32px -8px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 24px ${colors.glow}`}
              transition="all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)"
            >
              {/* Thanh màu bên trái — neon bar */}
              <Box
                position="absolute"
                left={0}
                top={0}
                bottom={0}
                w="4px"
                borderRadius="full"
                background={`linear-gradient(to bottom, ${colors.gradFrom}, ${colors.gradTo})`}
                boxShadow={`0 0 10px ${colors.bar}`}
              />

              {/* Icon */}
              {toast.type === "loading" ? (
                <Spinner size="sm" color={INDICATOR_COLORS[type]} mt="2px" />
              ) : (
                <Toast.Indicator color={INDICATOR_COLORS[type]} mt="2px" />
              )}

              {/* Nội dung */}
              <Stack gap="0.5" flex="1" maxWidth="100%">
                {toast.title && (
                  <Toast.Title fontWeight="bold" color="white" fontSize="sm">
                    {toast.title}
                  </Toast.Title>
                )}
                {toast.description && (
                  <Toast.Description
                    color="whiteAlpha.700"
                    fontSize="xs"
                    lineHeight="1.5"
                  >
                    {toast.description}
                  </Toast.Description>
                )}
              </Stack>

              {/* Action label */}
              {toast.action && (
                <Toast.ActionTrigger asChild>
                  <Box
                    as="button"
                    fontSize="xs"
                    fontWeight="bold"
                    color={INDICATOR_COLORS[type]}
                    _hover={{ textDecoration: "underline" }}
                    flexShrink={0}
                  >
                    {toast.action.label}
                  </Box>
                </Toast.ActionTrigger>
              )}

              {/* Close button */}
              {toast.meta?.closable && (
                <Toast.CloseTrigger
                  color="whiteAlpha.500"
                  _hover={{ color: "white", bg: "whiteAlpha.200" }}
                  position="absolute"
                  top={2}
                  right={2}
                  borderRadius="md"
                />
              )}
            </Toast.Root>
          );
        }}
      </ChakraToaster>
    </Portal>
  );
};
