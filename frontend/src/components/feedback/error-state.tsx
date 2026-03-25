/**
 * ErrorState Component
 * Display when error occurs
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'

interface ErrorStateProps extends BaseProps {
  /** Error title */
  title?: string
  /** Error message/description */
  message?: string
  /** Retry action */
  onRetry?: () => void
  /** Custom action */
  action?: React.ReactNode
}

export function ErrorState({
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      role="alert"
    >
      <div className="mb-4 text-destructive">
        {/* Error icon placeholder - use Lucide icon in actual implementation */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Thử lại
          </button>
        )}
        {action}
      </div>
    </div>
  )
}
