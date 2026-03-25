/**
 * useDisclosure Hook
 * Manages boolean state for modals, dropdowns, etc.
 */

import { useCallback, useState } from 'react'

interface UseDisclosureReturn {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
  setIsOpen: (value: boolean) => void
}

export function useDisclosure(initialState = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  return { isOpen, open, close, toggle, setIsOpen }
}
