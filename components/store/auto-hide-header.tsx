"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"

const THRESHOLD = 6 // ignore tiny scroll jitters

/**
 * Not a sticky header. It sits in normal flow and scrolls away with the page. Once you are past
 * it, scrolling down keeps it out of sight, and the moment you scroll up it slides in from the
 * top. Back at the very top it returns to normal flow. Focus inside it always shows it.
 *
 * While floating it is `position: fixed`, so the wrapper reserves its height to stop the page
 * from jumping when it leaves normal flow.
 */
export function AutoHideHeader({ children }: { children: ReactNode }) {
  const inner = useRef<HTMLDivElement>(null)
  const [floating, setFloating] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [reserve, setReserve] = useState(0)
  const last = useRef(0)
  const frame = useRef(0)
  const focusInside = useRef(false)
  const floatingRef = useRef(false)

  useEffect(() => {
    last.current = window.scrollY
    const setMode = (value: boolean) => { floatingRef.current = value; setFloating(value) }
    const update = () => {
      frame.current = 0
      const y = Math.max(0, window.scrollY)
      const delta = y - last.current
      const height = inner.current?.offsetHeight ?? 0
      if (y <= 0) { setMode(false); setHidden(false) }
      else if (!floatingRef.current) {
        // Still in normal flow. Only once the header is fully off screen do we take it out of flow,
        // hidden, so nothing visibly moves.
        if (y > height) { setReserve(height); setMode(true); setHidden(true) }
      } else if (delta < -THRESHOLD) setHidden(false)
      else if (delta > THRESHOLD && !focusInside.current) setHidden(true)
      if (Math.abs(delta) > THRESHOLD || y <= 0) last.current = y
    }
    const onScroll = () => { if (!frame.current) frame.current = window.requestAnimationFrame(update) }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => { window.removeEventListener("scroll", onScroll); if (frame.current) window.cancelAnimationFrame(frame.current) }
  }, [])

  return (
    <div style={floating ? { minHeight: reserve } : undefined}>
      <div
        ref={inner}
        onFocusCapture={() => { focusInside.current = true; setHidden(false) }}
        onBlurCapture={() => { focusInside.current = false }}
        className={`z-40 ${floating ? "fixed inset-x-0 top-0 transition-transform duration-300 ease-out motion-reduce:transition-none" : "relative"} ${floating && !hidden ? "shadow-lg" : ""}`}
        style={floating ? { transform: hidden ? "translateY(-100%)" : "translateY(0)" } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
