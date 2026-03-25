/**
 * PriceInput Component
 * Number input formatted as Vietnamese currency
 */

import { forwardRef, useCallback, useState } from 'react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/format'

interface PriceInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number
  onChange?: (value: number | undefined) => void
  /** Currency suffix */
  suffix?: string
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ value, onChange, suffix = 'đ', className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState(() =>
      value ? formatCurrency(value, false) : ''
    )

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, '')
        const numericValue = rawValue ? Number.parseInt(rawValue, 10) : undefined

        setDisplayValue(numericValue ? formatCurrency(numericValue, false) : '')
        onChange?.(numericValue)
      },
      [onChange]
    )

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            suffix && 'pr-8',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    )
  }
)

PriceInput.displayName = 'PriceInput'
