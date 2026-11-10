"use client"
import { useId, useState } from "react"

/** Tiny dependency-free SVG charts. Colours come from CSS variables so they follow the theme. */

export function Sparkline({ data, className = "text-primary" }: { data: number[]; className?: string }) {
  const id = useId()
  const max = Math.max(...data), min = Math.min(...data)
  const w = 100, h = 32
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - ((v - min) / (max - min || 1)) * (h - 4)] as const)
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`h-8 w-full ${className}`} aria-hidden="true">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity="0.25" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${w},${h} L0,${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export type Point = { label: string; value: number }

/** Area chart with grid, axis labels and a hover tooltip. */
export function AreaChart({ points, format, previous }: { points: Point[]; format: (v: number) => string; previous?: Point[] }) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const W = 800, H = 280, padL = 8, padR = 8, padT = 16, padB = 28
  const all = [...points, ...(previous ?? [])].map((p) => p.value)
  const max = Math.max(...all) * 1.1 || 1
  const x = (i: number) => padL + (i / (points.length - 1)) * (W - padL - padR)
  const y = (v: number) => padT + (1 - v / max) * (H - padT - padB)
  const path = (pts: Point[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ")
  const ticks = [0, 0.25, 0.5, 0.75, 1]
  const labelEvery = Math.ceil(points.length / 6)
  const active = hover ?? points.length - 1
  return (
    <div className="relative" onPointerLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-72 w-full text-primary" role="img" aria-label={`Chart from ${points[0].label} to ${points[points.length - 1].label}`}
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const rel = ((e.clientX - r.left) / r.width) * W; setHover(Math.min(points.length - 1, Math.max(0, Math.round(((rel - padL) / (W - padL - padR)) * (points.length - 1))))) }}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity="0.28" /><stop offset="1" stopColor="currentColor" stopOpacity="0.02" /></linearGradient></defs>
        {ticks.map((t) => <line key={t} x1={padL} x2={W - padR} y1={y(max * t / 1.1 * 1.1)} y2={y(max * t / 1.1 * 1.1)} stroke="currentColor" strokeOpacity="0.1" strokeDasharray="4 4" />)}
        {previous && <path d={path(previous)} fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" strokeDasharray="5 5" />}
        <path d={`${path(points)} L${x(points.length - 1)},${H - padB} L${x(0)},${H - padB} Z`} fill={`url(#${id})`} />
        <path d={path(points)} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => i % labelEvery === 0 && <text key={p.label} x={x(i)} y={H - 8} textAnchor={i === 0 ? "start" : "middle"} className="fill-muted-foreground text-[11px]">{p.label}</text>)}
        <line x1={x(active)} x2={x(active)} y1={padT} y2={H - padB} stroke="currentColor" strokeOpacity="0.25" />
        <circle cx={x(active)} cy={y(points[active].value)} r="5" className="fill-card" stroke="currentColor" strokeWidth="2.5" />
      </svg>
      <div className="pointer-events-none absolute right-2 top-0 rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
        <p className="text-xs text-muted-foreground">{points[active].label}</p>
        <p className="price font-semibold">{format(points[active].value)}</p>
      </div>
    </div>
  )
}

const PALETTE = ["var(--color-primary)", "oklch(0.62 0.17 255)", "oklch(0.72 0.15 160)", "oklch(0.8 0.15 85)", "oklch(0.65 0.2 305)", "oklch(0.7 0.02 260)"]

export function Donut({ segments, centerLabel, centerValue }: { segments: { label: string; value: number }[]; centerLabel: string; centerValue: string }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const R = 52, C = 2 * Math.PI * R
  // Start position of each arc, computed up front so nothing is reassigned during render.
  const arcs = segments.reduce<{ len: number; start: number }[]>((acc, seg) => { const start = acc.length ? acc[acc.length - 1].start + acc[acc.length - 1].len : 0; return [...acc, { len: (seg.value / total) * C, start }] }, [])
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
          <circle cx="70" cy="70" r={R} fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="18" />
          {segments.map((seg, i) => <circle key={seg.label} cx="70" cy="70" r={R} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="18" strokeDasharray={`${Math.max(arcs[i].len - 2, 0)} ${C}`} strokeDashoffset={-arcs[i].start} />)}
        </svg>
        <div className="absolute inset-0 grid place-content-center text-center"><p className="price text-2xl font-bold">{centerValue}</p><p className="text-xs text-muted-foreground">{centerLabel}</p></div>
      </div>
      <ul className="grid min-w-0 flex-1 gap-2 text-sm">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />{s.label}</span><span className="price font-medium">{s.value}</span></li>
        ))}
      </ul>
    </div>
  )
}

export function BarList({ items, format }: { items: { label: string; value: number; note?: string }[]; format: (v: number) => string }) {
  const max = Math.max(...items.map((i) => i.value)) || 1
  return (
    <ul className="grid gap-3">
      {items.map((it) => (
        <li key={it.label} className="grid gap-1.5 text-sm">
          <div className="flex items-baseline justify-between gap-3"><span className="min-w-0 truncate font-medium">{it.label}</span><span className="price shrink-0 text-muted-foreground">{format(it.value)}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-gradient-to-r from-primary/70 to-primary" style={{ width: `${(it.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  )
}
