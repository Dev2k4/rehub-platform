/**
 * EmptyState Component
 * Display when no data/results found
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'

interface EmptyStateProps extends BaseProps {
  /** Icon component or element */
  icon?: React.ReactNode
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Action button/element */
  action?: React.ReactNode
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground/50">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
