/**
 * useAsync Hook
 * Manages async operations with loading/error states
 */

import { useCallback, useState } from 'react'
import type { AsyncState, LoadingState } from '@/types/common'

interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  execute: (...args: Args) => Promise<T | null>
  reset: () => void
  setData: (data: T | null) => void
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

export function useAsync<T, Args extends unknown[] = []>(
  asyncFunction: (...args: Args) => Promise<T>
): UseAsyncReturn<T, Args> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    status: 'idle',
    error: null,
  })

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      setState({ data: null, status: 'loading', error: null })

      try {
        const result = await asyncFunction(...args)
        setState({ data: result, status: 'success', error: null })
        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        setState({ data: null, status: 'error', error: err })
        return null
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setState({ data: null, status: 'idle', error: null })
  }, [])

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error',
  }
}
