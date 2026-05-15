import {
  Box,
  Dialog,
  Flex,
  Icon,
  Portal,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useState } from "react"
import { FiAlertOctagon } from "react-icons/fi"
import { Button } from "@/components/ui/button"
import type { ListingRead } from "@/client"

interface RejectListingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listing: ListingRead | null
  onConfirm: (reason: string) => void
  isLoading?: boolean
}

export function RejectListingDialog({
  open,
  onOpenChange,
  listing,
  onConfirm,
  isLoading = false,
}: RejectListingDialogProps) {
  const [reason, setReason] = useState("")

  const handleConfirm = () => {
    onConfirm(reason.trim())
    setReason("")
  }

  const handleClose = () => {
    setReason("")
    onOpenChange(false)
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) handleClose()
      }}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(6px)" />
        <Dialog.Positioner>
          <Dialog.Content
            maxW="480px"
            borderRadius="2xl"
            p={0}
            overflow="hidden"
            boxShadow="0 30px 80px rgba(0,0,0,0.18)"
            border="1px solid"
            borderColor="red.100"
          >
            {/* Header với gradient đỏ nhạt */}
            <Flex
              direction="column"
              align="center"
              gap={3}
              pt={8}
              pb={5}
              px={7}
              bg="linear-gradient(135deg, #fff5f5 0%, #ffe4e4 100%)"
              borderBottom="1px solid"
              borderColor="red.100"
            >
              <Flex
                w={14}
                h={14}
                align="center"
                justify="center"
                borderRadius="full"
                bg="white"
                boxShadow="0 4px 16px rgba(220,38,38,0.18)"
                border="2px solid"
                borderColor="red.200"
              >
                <Icon as={FiAlertOctagon} w={7} h={7} color="red.500" />
              </Flex>
              <VStack gap={1} textAlign="center">
                <Dialog.Title
                  fontSize="xl"
                  fontWeight="800"
                  color="gray.900"
                  letterSpacing="-0.02em"
                >
                  Từ chối tin đăng
                </Dialog.Title>
                <Text color="gray.500" fontSize="sm" lineHeight="1.6">
                  Bạn sắp từ chối tin đăng{" "}
                  <Text as="span" fontWeight="700" color="gray.800">
                    &ldquo;{listing?.title}&rdquo;
                  </Text>
                  . Người dùng sẽ nhận được thông báo.
                </Text>
              </VStack>
            </Flex>

            {/* Body — nhập lý do */}
            <Box px={7} py={5}>
              <Text
                fontSize="sm"
                fontWeight="600"
                color="gray.700"
                mb={2}
              >
                Lý do từ chối{" "}
                <Text as="span" color="gray.400" fontWeight="400">
                  (tùy chọn)
                </Text>
              </Text>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Vd: Tin đăng không đúng danh mục, hình ảnh không hợp lệ, giá quá cao so với thực tế..."
                rows={4}
                borderRadius="xl"
                border="1.5px solid"
                borderColor="gray.200"
                bg="gray.50"
                fontSize="sm"
                color="gray.700"
                resize="none"
                _focus={{
                  borderColor: "red.400",
                  bg: "white",
                  boxShadow: "0 0 0 3px rgba(220,38,38,0.08)",
                }}
                _placeholder={{ color: "gray.400" }}
                transition="all 0.2s"
              />
              {reason.length > 0 && (
                <Text
                  fontSize="xs"
                  color="gray.400"
                  mt={1}
                  textAlign="right"
                >
                  {reason.length}/1000
                </Text>
              )}
            </Box>

            {/* Footer */}
            <Flex gap={3} px={7} pb={7} pt={1}>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                borderRadius="xl"
                flex={1}
                borderColor="gray.200"
                color="gray.600"
                _hover={{ bg: "gray.50", borderColor: "gray.300" }}
              >
                Hủy bỏ
              </Button>
              <Button
                colorPalette="red"
                onClick={handleConfirm}
                loading={isLoading}
                loadingText="Đang xử lý..."
                borderRadius="xl"
                flex={1}
                style={{
                  background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                }}
                _hover={{ opacity: 0.92, transform: "translateY(-1px)" }}
                boxShadow="0 4px 14px rgba(220,38,38,0.3)"
                transition="all 0.2s"
              >
                Từ chối tin đăng
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
