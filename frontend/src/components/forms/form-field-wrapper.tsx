/**
 * FormField Component
 * Wrapper for form inputs with label, error, helper text
 */

import { cn } from '@/lib/utils'
import type { BaseProps } from '@/types/common'

interface FormFieldWrapperProps extends BaseProps {
  /** Field label */
  label?: string
  /** Field name (for accessibility) */
  name: string
  /** Error message */
  error?: string
  /** Helper text */
  helperText?: string
  /** Required indicator */
  required?: boolean
}

export function FormFieldWrapper({
  label,
  name,
  error,
  helperText,
  required,
  className,
  children,
}: FormFieldWrapperProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label
          htmlFor={name}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-sm text-muted-foreground">{helperText}</p>
      )}
    </div>
  )
}
