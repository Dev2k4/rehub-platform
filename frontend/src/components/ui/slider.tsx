import { Slider as ChakraSlider } from "@chakra-ui/react"
import { forwardRef } from "react"

export interface SliderProps extends ChakraSlider.RootProps {
  marks?: Array<number | { value: number; label: React.ReactNode }>
  label?: React.ReactNode
  showValue?: boolean
}

export const Slider = {
  ...ChakraSlider,
  Root: forwardRef<HTMLDivElement, SliderProps>(function SliderRoot(
    props,
    ref,
  ) {
    const { children, marks, label, showValue, ...rest } = props
    return (
      <ChakraSlider.Root ref={ref} {...rest}>
        {label && (
          <ChakraSlider.Label fontWeight="medium">{label}</ChakraSlider.Label>
        )}
        {children}
        {showValue && (
          <ChakraSlider.ValueText ml="2" fontSize="sm" fontWeight="medium" />
        )}
      </ChakraSlider.Root>
    )
  }),
  Track: ChakraSlider.Track,
  Range: ChakraSlider.Range,
  Thumb: ChakraSlider.Thumb,
  MarkerGroup: ChakraSlider.MarkerGroup,
  Marker: ChakraSlider.Marker,
}