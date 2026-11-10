"use client"
import { useSyncExternalStore } from "react"

const QUERY = "(prefers-reduced-motion: reduce)"

/**
 * True when the visitor prefers reduced motion. The server snapshot is `true` (the safe
 * choice), so server HTML and the first client render always match. The real value is
 * applied right after hydration.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY)
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    },
    () => window.matchMedia(QUERY).matches,
    () => true,
  )
}
