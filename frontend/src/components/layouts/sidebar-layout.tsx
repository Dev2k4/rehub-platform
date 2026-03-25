/**
 * SidebarLayout Component
 * Two-column layout with sidebar
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'

interface SidebarLayoutProps extends BaseProps {
  /** Sidebar content */
  sidebar: React.ReactNode
  /** Main content */
  content: React.ReactNode
  /** Sidebar position */
  sidebarPosition?: 'left' | 'right'
  /** Sidebar width */
  sidebarWidth?: 'sm' | 'md' | 'lg'
  /** Sticky sidebar */
  stickyHeader?: boolean
}

const sidebarWidthClasses = {
  sm: 'w-64',
  md: 'w-72',
  lg: 'w-80',
}

export function SidebarLayout({
  sidebar,
  content,
  sidebarPosition = 'left',
  sidebarWidth = 'md',
  stickyHeader = true,
  className,
}: SidebarLayoutProps) {
  const sidebarEl = (
    <aside
      className={cn(
        'hidden lg:block flex-shrink-0',
        sidebarWidthClasses[sidebarWidth],
        stickyHeader && 'lg:sticky lg:top-4 lg:self-start'
      )}
    >
      {sidebar}
    </aside>
  )

  return (
    <div
      className={cn(
        'flex gap-6 lg:gap-8',
        sidebarPosition === 'right' && 'flex-row-reverse',
        className
      )}
    >
      {sidebarEl}
      <main className="flex-1 min-w-0">{content}</main>
    </div>
  )
}
