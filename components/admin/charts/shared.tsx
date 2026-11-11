"use client"
import type { ReactNode } from "react"
import { useSyncExternalStore } from "react"

/** Chart colours come from the admin "desk" tokens in globals.css, so light and dark mode both stay on-brand. */
export const C = {
  accent: "var(--desk-accent)", accentSoft: "var(--desk-accent-soft)", ink: "var(--desk-ink)", grid: "var(--desk-grid)", axis: "var(--desk-axis)",
  card: "var(--card)", up: "var(--desk-up)", down: "var(--desk-down)",
  series: ["var(--desk-accent)", "var(--desk-2)", "var(--desk-3)", "var(--desk-4)", "var(--desk-5)", "var(--desk-6)"],
} as const

function useMedia(query: string, server: boolean) {
  return useSyncExternalStore(
    (cb) => { const m = window.matchMedia(query); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb) },
    () => window.matchMedia(query).matches,
    () => server,
  )
}
/** True when the person asked their system for less motion: charts then draw instantly. */
export const useReducedMotion = () => useMedia("(prefers-reduced-motion: reduce)", false)
/** True from the `sm` breakpoint up. Used to give chart labels more room on wide screens. */
export const useWide = () => useMedia("(min-width: 640px)", true)

export const AXIS_TICK = { fontSize: 11, fill: C.axis } as const

/** The look shared by every chart tooltip: a small card with a title and rows of "swatch label ... value". */
export type TipRow = { label: string; value: string; color?: string; dashed?: boolean }
export function TipCard({ title, rows, footer }: { title: string; rows: TipRow[]; footer?: ReactNode }) {
  return (
    <div className="min-w-44 rounded-lg border bg-popover px-3 py-2.5 text-xs text-popover-foreground shadow-lg">
      <p className="desk-eyebrow mb-1.5">{title}</p>
      <ul className="grid gap-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.color && <span aria-hidden="true" className="inline-block h-0.5 w-3 rounded-full" style={{ background: r.dashed ? "transparent" : r.color, borderTop: r.dashed ? `2px dashed ${r.color}` : undefined, height: r.dashed ? 0 : undefined }} />}
              {r.label}
            </span>
            <span className="price font-semibold">{r.value}</span>
          </li>
        ))}
      </ul>
      {footer && <div className="mt-2 border-t pt-2">{footer}</div>}
    </div>
  )
}

/** "+12.4%" or "-3.1%" with an up/down colour. Pass null when there is nothing to compare with. */
export function DeltaText({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted-foreground">No earlier data</span>
  const up = pct >= 0
  return <span className="price font-semibold" style={{ color: up ? C.up : C.down }}>{up ? "+" : "-"}{Math.abs(pct).toFixed(1)}%</span>
}

/**
 * Wraps a chart for assistive tech: the picture is exposed as one image with a text summary, and a visually
 * hidden table next to it carries every number.
 */
export function ChartFrame({ summary, className = "h-64", table, children }: { summary: string; className?: string; table?: { caption: string; head: string[]; rows: (string | number)[][] }; children: ReactNode }) {
  return (
    <figure className="m-0 min-w-0">
      <div role="img" aria-label={summary} className={`min-w-0 ${className}`}>{children}</div>
      {table && (
        <div className="sr-only"><table>
          <caption>{table.caption}</caption>
          <thead><tr>{table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}</tr>)}</tbody>
        </table></div>
      )}
    </figure>
  )
}

/** Shown in place of a chart when the chosen range has nothing in it. */
export function EmptyChart({ title, hint, className = "h-48" }: { title: string; hint: string; className?: string }) {
  return (
    <div className={`grid place-content-center gap-1 rounded-lg border border-dashed px-6 text-center ${className}`}>
      <p className="font-display text-lg">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>
    </div>
  )
}
