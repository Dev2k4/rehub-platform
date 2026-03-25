/**
 * Section Component
 * Content section with optional title
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'

interface SectionProps extends BaseProps {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Right side actions */
  actions?: React.ReactNode
  /** Add top margin */
  marginTop?: boolean
}

export function Section({
  title,
  description,
  actions,
  marginTop = true,
  className,
  children,
}: SectionProps) {
  return (
    <section className={cn(marginTop && 'mt-8', className)}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
