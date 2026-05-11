import { Dialog, Flex, Icon, Portal, Text, VStack } from "@chakra-ui/react"
import { FiAlertTriangle } from "react-icons/fi"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText: string
  confirmColorPalette?: string
  onConfirm: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  confirmColorPalette = "red",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="sm"
            borderRadius="1.5rem"
            p={0}
            overflow="hidden"
            boxShadow="0 25px 60px rgba(0,0,0,0.15)"
            border="1px solid"
            borderColor="gray.100"
          >
            {/* Warning icon header */}
            <Flex
              justify="center"
              pt={8}
              pb={4}
              px={6}
              direction="column"
              align="center"
              gap={3}
            >
              <Flex
                w={14}
                h={14}
                align="center"
                justify="center"
                borderRadius="full"
                bg={`${confirmColorPalette}.50`}
                border="3px solid"
                borderColor={`${confirmColorPalette}.100`}
              >
                <Icon
                  as={FiAlertTriangle}
                  w={7}
                  h={7}
                  color={`${confirmColorPalette}.500`}
                />
              </Flex>
              <VStack gap={1} textAlign="center">
                <Dialog.Title fontSize="lg" fontWeight="700" color="gray.900">
                  {title}
                </Dialog.Title>
                <Text color="gray.500" fontSize="sm" lineHeight="1.6">
                  {description}
                </Text>
              </VStack>
            </Flex>

            {/* Footer */}
            <Flex gap={3} justify="center" px={6} pb={7} pt={2}>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                borderRadius="xl"
                flex={1}
              >
                Hủy bỏ
              </Button>
              <Button
                colorPalette={confirmColorPalette}
                onClick={onConfirm}
                loading={isLoading}
                loadingText="Đang xử lý..."
                borderRadius="xl"
                flex={1}
              >
                {confirmText}
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
