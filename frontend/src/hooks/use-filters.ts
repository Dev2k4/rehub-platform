/**
 * useFilters Hook
 * Manages filter state with URL sync
 */

import { useCallback, useMemo, useState } from 'react'
import type { BaseFilters, SortDirection } from '@/types/common'

interface UseFiltersProps<T extends BaseFilters> {
  initialFilters?: T
  defaultFilters: T
}

interface UseFiltersReturn<T extends BaseFilters> {
  filters: T
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void
  setFilters: (newFilters: Partial<T>) => void
  resetFilters: () => void
  clearFilter: (key: keyof T) => void
  hasActiveFilters: boolean
  activeFilterCount: number
  toggleSort: (field: string) => void
}

export function useFilters<T extends BaseFilters>({
  initialFilters,
  defaultFilters,
}: UseFiltersProps<T>): UseFiltersReturn<T> {
  const [filters, setFiltersState] = useState<T>({
    ...defaultFilters,
    ...initialFilters,
  })

  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }))
  }, [])

  const setFilters = useCallback((newFilters: Partial<T>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters)
  }, [defaultFilters])

  const clearFilter = useCallback(
    (key: keyof T) => {
      setFiltersState((prev) => ({ ...prev, [key]: defaultFilters[key] }))
    },
    [defaultFilters]
  )

  const toggleSort = useCallback((field: string) => {
    setFiltersState((prev) => ({
      ...prev,
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === 'asc' ? 'desc' : ('asc' as SortDirection),
    }))
  }, [])

  const { hasActiveFilters, activeFilterCount } = useMemo(() => {
    let count = 0
    const filterKeys = Object.keys(filters) as (keyof T)[]

    for (const key of filterKeys) {
      // Skip pagination and sort
      if (['page', 'limit', 'sortBy', 'sortDir'].includes(key as string)) continue

      const value = filters[key]
      const defaultValue = defaultFilters[key]

      if (value !== defaultValue && value !== undefined && value !== '') {
        count++
      }
    }

    return { hasActiveFilters: count > 0, activeFilterCount: count }
  }, [filters, defaultFilters])

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
    toggleSort,
  }
}
