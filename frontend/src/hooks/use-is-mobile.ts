import { useMediaQuery } from "./use-media-query"

const MOBILE_BREAKPOINT = 768

/**
 * Check if viewport is mobile
 */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}
