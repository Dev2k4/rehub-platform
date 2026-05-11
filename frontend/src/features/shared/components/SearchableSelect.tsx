import { Box, Spinner, Text } from "@chakra-ui/react"
import { useEffect, useMemo, useRef, useState } from "react"
import { FiChevronDown, FiMapPin, FiSearch } from "react-icons/fi"

export interface SelectOption {
  label: string
  value: string
}

export interface SearchableSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  loading?: boolean
  disabled?: boolean
  /** Compact mode for inline filters (smaller height, no icon) */
  compact?: boolean
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  loading,
  disabled,
  compact,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, search])

  const selectedLabel = options.find((o) => o.value === value)?.label || ""

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  const height = compact ? "32px" : "40px"
  const fontSize = compact ? "xs" : "sm"

  return (
    <Box ref={wrapperRef} position="relative" w="full">
      {/* Trigger */}
      <Box
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen)
            setSearch("")
          }
        }}
        display="flex"
        alignItems="center"
        gap={compact ? 1.5 : 2}
        px={compact ? 2.5 : 3}
        h={height}
        borderRadius={compact ? "0.6rem" : "lg"}
        border="1px solid"
        borderColor={isOpen ? "blue.400" : "gray.200"}
        bg={disabled ? "gray.50" : "white"}
        cursor={disabled ? "not-allowed" : "pointer"}
        transition="all 0.2s"
        _hover={disabled ? {} : { borderColor: "blue.300" }}
        boxShadow={isOpen ? "0 0 0 1px var(--chakra-colors-blue-400)" : "none"}
        opacity={disabled ? 0.6 : 1}
      >
        {!compact && <FiMapPin size={14} color="#9CA3AF" style={{ flexShrink: 0 }} />}
        <Text
          flex={1}
          fontSize={fontSize}
          color={selectedLabel ? "gray.800" : "gray.400"}
          lineClamp={1}
        >
          {loading ? "Đang tải..." : selectedLabel || placeholder}
        </Text>
        {loading ? (
          <Spinner size="xs" color="blue.400" />
        ) : (
          <FiChevronDown
            size={compact ? 12 : 14}
            color="#9CA3AF"
            style={{
              flexShrink: 0,
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        )}
      </Box>

      {/* Dropdown */}
      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 4px)"
          left={0}
          minW="260px"
          bg="white"
          borderRadius="lg"
          border="1px solid"
          borderColor="gray.200"
          boxShadow="0 10px 40px rgba(0,0,0,0.12)"
          zIndex={100}
          overflow="hidden"
          maxH="280px"
          display="flex"
          flexDirection="column"
        >
          {/* Search */}
          {options.length > 6 && (
            <Box p={2} borderBottom="1px solid" borderColor="gray.100">
              <Box
                display="flex"
                alignItems="center"
                gap={2}
                px={2.5}
                h="34px"
                borderRadius="md"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
              >
                <FiSearch size={13} color="#9CA3AF" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm..."
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "13px",
                    color: "#1a202c",
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Options */}
          <Box overflowY="auto" maxH="220px" className="scrollbar-thin">
            {/* Clear option */}
            {value && (
              <Box
                px={3}
                py={2}
                fontSize={fontSize}
                color="red.400"
                fontWeight="500"
                cursor="pointer"
                transition="all 0.12s"
                _hover={{ bg: "red.50" }}
                borderBottom="1px solid"
                borderColor="gray.100"
                onClick={() => {
                  onChange("")
                  setIsOpen(false)
                  setSearch("")
                }}
              >
                ✕ Bỏ chọn
              </Box>
            )}
            {filtered.length === 0 ? (
              <Box px={3} py={4} textAlign="center">
                <Text fontSize="sm" color="gray.400">
                  Không tìm thấy kết quả
                </Text>
              </Box>
            ) : (
              filtered.map((opt) => (
                <Box
                  key={opt.value}
                  px={3}
                  py={2}
                  fontSize={fontSize}
                  color={opt.value === value ? "blue.600" : "gray.700"}
                  fontWeight={opt.value === value ? "600" : "normal"}
                  bg={opt.value === value ? "blue.50" : "transparent"}
                  cursor="pointer"
                  transition="all 0.12s"
                  _hover={{ bg: opt.value === value ? "blue.50" : "gray.50" }}
                  onClick={() => {
                    onChange(opt.value)
                    setIsOpen(false)
                    setSearch("")
                  }}
                >
                  {opt.label}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}
