import { Box, HStack, IconButton } from "@chakra-ui/react"
import { FiStar } from "react-icons/fi"

type RatingStarsProps = {
  value: number
  onChange?: (value: number) => void
  size?: number
  readOnly?: boolean
}

export function RatingStars({
  value,
  onChange,
  size = 18,
  readOnly = false,
}: RatingStarsProps) {
  const isInteractive = !readOnly && typeof onChange === "function"

  return (
    <HStack gap={1}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1
        const active = starValue <= value

        if (!isInteractive) {
          return (
            <Box
              key={starValue}
              as={FiStar}
              w={`${size}px`}
              h={`${size}px`}
              color={active ? "yellow.400" : "gray.300"}
              fill={active ? "currentColor" : "none"}
            />
          )
        }

        return (
          <IconButton
            key={starValue}
            aria-label={`Đánh giá ${starValue} sao`}
            variant="ghost"
            minW="auto"
            h="auto"
            p={0}
            onClick={() => onChange?.(starValue)}
          >
            <Box
              as={FiStar}
              w={`${size}px`}
              h={`${size}px`}
              color={active ? "yellow.400" : "gray.300"}
              fill={active ? "currentColor" : "none"}
            />
          </IconButton>
        )
      })}
    </HStack>
  )
}
