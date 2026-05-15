import { Box, Center, Flex, Icon, Image, Text, VStack, Button } from "@chakra-ui/react"
import { useRef, useState, useEffect } from "react"
import { FiCamera, FiX } from "react-icons/fi"
import { toaster } from "@/components/ui/toaster"

interface ProofImageUploaderProps {
  onFileSelect: (file: File | null) => void
  label?: string
  disabled?: boolean
}

export function ProofImageUploader({ onFileSelect, label = "Tải ảnh bằng chứng", disabled }: ProofImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toaster.create({ title: "Chỉ hỗ trợ file ảnh", type: "error" })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toaster.create({ title: "Ảnh quá lớn (tối đa 10MB)", type: "error" })
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    onFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleClear = () => {
    setPreviewUrl(null)
    onFileSelect(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (previewUrl) {
    return (
      <Box position="relative" w="full" maxW="360px" borderRadius="xl" overflow="hidden" border="1px solid" borderColor="gray.200">
        <Image src={previewUrl} alt="Proof preview" w="full" h="160px" objectFit="cover" />
        <Button
          position="absolute"
          top={2}
          right={2}
          size="sm"
          variant="solid"
          colorPalette="red"
          borderRadius="full"
          onClick={handleClear}
          disabled={disabled}
        >
          <FiX />
        </Button>
      </Box>
    )
  }

  return (
    <Box
      w="full"
      maxW="360px"
      h="120px"
      border="2px dashed"
      borderColor={isDragging ? "blue.400" : "gray.300"}
      borderRadius="xl"
      bg={isDragging ? "blue.50" : disabled ? "gray.50" : "white"}
      transition="all 0.2s"
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      cursor={disabled ? "not-allowed" : "pointer"}
      opacity={disabled ? 0.6 : 1}
      _hover={disabled ? {} : { borderColor: "blue.400", bg: "blue.50" }}
    >
      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileSelect(file)
        }}
      />
      <VStack h="full" justify="center" gap={1}>
        <Icon as={FiCamera} boxSize={6} color="gray.400" />
        <Text fontSize="sm" fontWeight="medium" color="gray.600">
          {label}
        </Text>
        <Text fontSize="xs" color="gray.400">
          Kéo thả hoặc bấm để chọn ảnh
        </Text>
      </VStack>
    </Box>
  )
}
