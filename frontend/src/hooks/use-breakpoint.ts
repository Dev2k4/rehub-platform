/**
 * useBreakpoint Hook
 * Responsive breakpoint detection
 */

import { useEffect, useState } from 'react'
import { BREAKPOINTS } from '@/config/constants'

type Breakpoint = keyof typeof BREAKPOINTS

interface UseBreakpointReturn {
  breakpoint: Breakpoint | null
  isXs: boolean
  isSm: boolean
  isMd: boolean
  isLg: boolean
  isXl: boolean
  is2xl: boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

function getBreakpoint(width: number): Breakpoint | null {
  if (width >= BREAKPOINTS['2xl']) return '2xl'
  if (width >= BREAKPOINTS.xl) return 'xl'
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
  if (width >= BREAKPOINTS.sm) return 'sm'
  return null
}

export function useBreakpoint(): UseBreakpointReturn {
  const [breakpoint, setBreakpoint] = useState<Breakpoint | null>(() => {
    if (typeof window === 'undefined') return null
    return getBreakpoint(window.innerWidth)
  })

  useEffect(() => {
    const handleResize = () => {
      setBreakpoint(getBreakpoint(window.innerWidth))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const width = typeof window !== 'undefined' ? window.innerWidth : 0

  return {
    breakpoint,
    isXs: breakpoint === null,
    isSm: width >= BREAKPOINTS.sm,
    isMd: width >= BREAKPOINTS.md,
    isLg: width >= BREAKPOINTS.lg,
    isXl: width >= BREAKPOINTS.xl,
    is2xl: width >= BREAKPOINTS['2xl'],
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
  }
}
