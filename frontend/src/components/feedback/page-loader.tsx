/**
 * PageLoader Component
 * Full page loading skeleton
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'
import { Spinner } from './spinner'

interface PageLoaderProps extends BaseProps {
  /** Loading message */
  message?: string
}

export function PageLoader({ message, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        'flex min-h-[50vh] flex-col items-center justify-center gap-4',
        className
      )}
    >
      <Spinner size="lg" />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  )
}
