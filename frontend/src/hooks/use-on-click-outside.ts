import { useEffect, type RefObject } from "react"

type EventType = MouseEvent | TouchEvent

/**
 * Detect clicks outside of a ref element
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: EventType) => void
): void {
  useEffect(() => {
    const listener = (event: EventType) => {
      const el = ref?.current
      if (!el || el.contains((event?.target as Node) || null)) {
        return
      }
      handler(event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}
