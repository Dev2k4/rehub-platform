/**
 * SearchInput Component
 * Search input with icon and clear button
 */

import { forwardRef, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show clear button when has value */
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    const handleClear = useCallback(() => {
      onClear?.()
    }, [onClear])

    return (
      <div className="relative">
        {/* Search icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />

        {/* Clear button */}
        {value && onClear && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
