"use client"
import { useEffect, useRef, useState } from "react"
import { ArrowUp } from "lucide-react"

const SHOW_AFTER = 600
const R = 20
const CIRC = 2 * Math.PI * R

/** Floating button with a ring showing how far down the page you are. Smooth-scrolls to the top. */
export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    const update = () => {
      frame.current = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      setVisible(window.scrollY > SHOW_AFTER)
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    const onScroll = () => { if (!frame.current) frame.current = window.requestAnimationFrame(update) }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (frame.current) window.cancelAnimationFrame(frame.current) }
  }, [])

  return (
    <button
      type="button"
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
      className={`fixed bottom-5 right-5 z-30 grid size-12 place-items-center rounded-full bg-card text-foreground shadow-lg ring-1 ring-border transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground focus-visible:ring-[3px] focus-visible:ring-ring/60 motion-reduce:transition-none ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r={R} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="3" />
        <circle cx="24" cy="24" r={R} fill="none" className="text-primary" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={CIRC * (1 - progress)} />
      </svg>
      <ArrowUp className="relative size-5" aria-hidden="true" />
    </button>
  )
}
