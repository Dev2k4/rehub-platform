/**
 * Container Component
 * Responsive container with max-width
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'

interface ContainerProps extends BaseProps {
  /** Max width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Add horizontal padding */
  padded?: boolean
  /** Center content */
  centered?: boolean
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
}

export function Container({
  size = 'xl',
  padded = true,
  centered = true,
  className,
  children,
}: ContainerProps) {
  return (
    <div
      className={cn(
        'w-full',
        sizeClasses[size],
        padded && 'px-4 sm:px-6 lg:px-8',
        centered && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  )
}
