import { Dialog, Portal, Button, Text, Flex } from "@chakra-ui/react"

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
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" />
        <Dialog.Positioner>
          <Dialog.Content maxW="md" borderRadius="xl" p={6}>
            <Dialog.Header>
              <Dialog.Title fontSize="lg" fontWeight="semibold" color="gray.900">
                {title}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text color="gray.600" fontSize="sm">
                {description}
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Flex gap={3} justify="flex-end" w="full">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Hủy
                </Button>
                <Button
                  colorPalette={confirmColorPalette}
                  onClick={onConfirm}
                  loading={isLoading}
                >
                  {confirmText}
                </Button>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
