/**
 * PageHeader Component
 * Page title and actions header
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'

interface PageHeaderProps extends BaseProps {
  /** Page title */
  title: string
  /** Optional subtitle/description */
  subtitle?: string
  /** Breadcrumb component */
  breadcrumb?: React.ReactNode
  /** Action buttons */
  actions?: React.ReactNode
  /** Back button/link */
  backLink?: React.ReactNode
}

export function PageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  backLink,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6 space-y-2', className)}>
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      {backLink && <div className="mb-2">{backLink}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
