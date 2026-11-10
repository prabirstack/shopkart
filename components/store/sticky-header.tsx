"use client"
import { useEffect, useRef, useState, type ReactNode } from "react"

const HIDE_AFTER = 140 // px scrolled before the header may hide
const THRESHOLD = 6 // ignore tiny scroll jitters

/**
 * Smart header: stays in view at the top of the page, slides out of the way while you scroll
 * down, and slides back in as soon as you scroll up. It also shows while a control inside it
 * has keyboard focus, so Tab never lands on something you can't see.
 */
export function StickyHeader({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false)
  const [raised, setRaised] = useState(false) // extra shadow once the page has scrolled
  const last = useRef(0)
  const frame = useRef(0)
  const focusInside = useRef(false)

  useEffect(() => {
    last.current = window.scrollY
    const update = () => {
      frame.current = 0
      const y = Math.max(0, window.scrollY)
      const delta = y - last.current
      setRaised(y > 4)
      if (y < HIDE_AFTER) setHidden(false)
      else if (Math.abs(delta) > THRESHOLD) setHidden(delta > 0 && !focusInside.current)
      if (Math.abs(delta) > THRESHOLD || y < HIDE_AFTER) last.current = y
    }
    const onScroll = () => { if (!frame.current) frame.current = window.requestAnimationFrame(update) }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => { window.removeEventListener("scroll", onScroll); if (frame.current) window.cancelAnimationFrame(frame.current) }
  }, [])

  return (
    <div
      onFocusCapture={() => { focusInside.current = true; setHidden(false) }}
      onBlurCapture={() => { focusInside.current = false }}
      className={`sticky top-0 z-40 transition-[transform,box-shadow] duration-300 ease-out motion-reduce:transition-none ${raised ? "shadow-lg" : ""}`}
      style={{ transform: hidden ? "translateY(-100%)" : "translateY(0)" }}
    >
      {children}
    </div>
  )
}
