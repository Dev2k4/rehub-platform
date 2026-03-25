/**
 * Grid Layout Components
 * Responsive grid utilities
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'

// ============================================
// Grid Component
// ============================================

interface GridProps extends BaseProps {
  /** Number of columns (responsive) */
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  /** Gap size */
  gap?: 'sm' | 'md' | 'lg'
}

const colsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

export function Grid({
  cols = 4,
  gap = 'md',
  className,
  children,
}: GridProps) {
  return (
    <div className={cn('grid', colsClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  )
}

// ============================================
// Stack Component
// ============================================

interface StackProps extends BaseProps {
  /** Direction */
  direction?: 'row' | 'col'
  /** Gap size */
  gap?: 'xs' | 'sm' | 'md' | 'lg'
  /** Align items */
  align?: 'start' | 'center' | 'end' | 'stretch'
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  /** Wrap items */
  wrap?: boolean
}

const stackGapClasses = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
}

const alignClasses = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const justifyClasses = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
}

export function Stack({
  direction = 'col',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className,
  children,
}: StackProps) {
  return (
    <div
      className={cn(
        'flex',
        direction === 'row' ? 'flex-row' : 'flex-col',
        stackGapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  )
}
