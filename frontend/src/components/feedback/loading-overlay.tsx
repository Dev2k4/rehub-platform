/**
 * LoadingOverlay Component
 * Full-screen or container loading state
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'
import { Spinner } from './spinner'

interface LoadingOverlayProps extends BaseProps {
  /** Loading message */
  message?: string
  /** Cover full screen or just parent container */
  fullScreen?: boolean
  /** Show spinner */
  showSpinner?: boolean
}

export function LoadingOverlay({
  message = 'Đang tải...',
  fullScreen = false,
  showSpinner = true,
  className,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm',
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0',
        className
      )}
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      {showSpinner && <Spinner size="lg" />}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
