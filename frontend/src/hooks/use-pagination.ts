/**
 * usePagination Hook
 * Manages pagination state
 */

import { useCallback, useMemo, useState } from 'react'
import { PAGINATION } from '@/config/constants'

interface UsePaginationProps {
  total: number
  initialPage?: number
  initialLimit?: number
}

interface UsePaginationReturn {
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  nextPage: () => void
  prevPage: () => void
  goToFirst: () => void
  goToLast: () => void
  offset: number
}

export function usePagination({
  total,
  initialPage = PAGINATION.defaultPage,
  initialLimit = PAGINATION.defaultLimit,
}: UsePaginationProps): UsePaginationReturn {
  const [page, setPage] = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)

  const totalPages = useMemo(() => Math.ceil(total / limit) || 1, [total, limit])
  const hasNext = page < totalPages
  const hasPrev = page > 1
  const offset = (page - 1) * limit

  const handleSetPage = useCallback(
    (newPage: number) => {
      setPage(Math.max(1, Math.min(newPage, totalPages)))
    },
    [totalPages]
  )

  const handleSetLimit = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1) // Reset to first page when limit changes
  }, [])

  const nextPage = useCallback(() => {
    if (hasNext) setPage((p) => p + 1)
  }, [hasNext])

  const prevPage = useCallback(() => {
    if (hasPrev) setPage((p) => p - 1)
  }, [hasPrev])

  const goToFirst = useCallback(() => setPage(1), [])
  const goToLast = useCallback(() => setPage(totalPages), [totalPages])

  return {
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
    setPage: handleSetPage,
    setLimit: handleSetLimit,
    nextPage,
    prevPage,
    goToFirst,
    goToLast,
    offset,
  }
}
