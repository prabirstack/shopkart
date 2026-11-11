"use client"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { ArrowDownRight, ArrowUpRight, Download } from "lucide-react"
import { useReducedMotion } from "./charts/shared"
import type { Range } from "@/features/admin/analytics"

/** Shared building blocks of the admin "desk" design: ruled sections, count-up figures, the range switch. */

export const RANGES: { value: Range; label: string }[] = [{ value: 7, label: "7 days" }, { value: 30, label: "30 days" }, { value: 90, label: "90 days" }]

/** Percentage change from previous to current, or null when there is no earlier figure to compare with. */
export const pctChange = (current: number, previous: number) => (previous === 0 ? null : ((current - previous) / previous) * 100)

/** A figure that counts up on first render and tweens when its value changes. With reduced motion it simply shows the value. */
export function CountUp({ value, format, className }: { value: number; format: (n: number) => string; className?: string }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(value)
  const shownRef = useRef(value)
  const first = useRef(true)
  useEffect(() => {
    if (reduced) return
    const from = first.current ? 0 : shownRef.current
    first.current = false
    const start = performance.now(), dur = 900
    let raf = requestAnimationFrame(function tick(now) {
      const t = Math.min((now - start) / dur, 1), eased = 1 - Math.pow(1 - t, 4)
      shownRef.current = from + (value - from) * eased
      setShown(shownRef.current)
      if (t < 1) raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [value, reduced])
  const text = reduced ? format(value) : format(Math.round(shown))
  return <span className={className}><span aria-hidden="true">{text}</span><span className="sr-only">{format(value)}</span></span>
}

export function DeltaChip({ pct, label }: { pct: number | null; label?: string }) {
  if (pct === null) return <span className="text-xs text-muted-foreground">{label ?? "No earlier period to compare"}</span>
  const up = pct >= 0, Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="price inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-semibold" style={{ color: up ? "var(--desk-up)" : "var(--desk-down)", background: `color-mix(in oklab, ${up ? "var(--desk-up)" : "var(--desk-down)"} 12%, transparent)` }}>
        <Icon className="size-3.5" aria-hidden="true" /><span className="sr-only">{up ? "Up" : "Down"} </span>{Math.abs(pct).toFixed(1)}%
      </span>
      {label && <span className="text-muted-foreground">{label}</span>}
    </span>
  )
}

/** An unboxed section: a heavy ink rule on top, a serif heading, optional aside on the right. */
export function Panel({ id, title, aside, className = "", style, children }: { id: string; title: string; aside?: ReactNode; className?: string; style?: React.CSSProperties; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={`desk-rise min-w-0 border-t-2 border-foreground pt-3 ${className}`} style={style}>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id={id} className="font-display text-xl font-semibold">{title}</h2>
        {aside && <div className="text-sm">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

export function RangeControl({ value, onChange }: { value: Range; onChange: (r: Range) => void }) {
  return (
    <div role="group" aria-label="Date range" className="inline-flex rounded-lg border bg-card p-0.5 text-sm">
      {RANGES.map((r) => (
        <button key={r.value} type="button" aria-pressed={value === r.value} onClick={() => onChange(r.value)}
          className={`rounded-md px-3 py-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${value === r.value ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{r.label}</button>
      ))}
    </div>
  )
}

export function ExportButton({ onClick, children = "Export CSV" }: { onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium transition-colors hover:bg-muted">
      <Download className="size-4" aria-hidden="true" />{children}
    </button>
  )
}
