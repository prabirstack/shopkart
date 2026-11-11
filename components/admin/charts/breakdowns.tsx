"use client"
import Link from "next/link"
import { useState } from "react"
import { Area, AreaChart, Bar, BarChart, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts"
import { AXIS_TICK, C, ChartFrame, TipCard, useReducedMotion, useWide } from "./shared"
import { money, moneyCompact, number } from "@/features/admin/format"

// ---------------------------------------------------------------- sparkline
/** A tiny area chart for the headline figures: no axes, no tooltip, only the shape of the period. */
export function Spark({ data, tone = "accent" }: { data: number[]; tone?: "accent" | "ink" }) {
  const reduced = useReducedMotion()
  const color = tone === "accent" ? C.accent : C.ink
  const rows = data.map((v, i) => ({ i, v }))
  const gid = `spark-${tone}`
  return (
    <div aria-hidden="true" className="h-11 w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 200, height: 44 }}>
        <AreaChart data={rows} margin={{ top: 4, right: 1, left: 1, bottom: 2 }} accessibilityLayer={false}>
          <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" style={{ stopColor: color, stopOpacity: 0.22 }} /><stop offset="100%" style={{ stopColor: color, stopOpacity: 0 }} /></linearGradient></defs>
          <XAxis dataKey="i" hide /><YAxis hide domain={[0, "dataMax"]} />
          <Area dataKey="v" type="linear" stroke={color} strokeWidth={1.5} fill={`url(#${gid})`} dot={false} isAnimationActive={!reduced} animationDuration={800} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ---------------------------------------------------------------- donut
export type Slice = { label: string; value: number }

/** Sales by category as a ring with the total in the middle and a legend that doubles as the hover target. */
export function CategoryDonut({ slices, centerLabel }: { slices: Slice[]; centerLabel: string }) {
  const reduced = useReducedMotion()
  const [active, setActive] = useState<number | null>(null)
  const total = slices.reduce((t, s) => t + s.value, 0)
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0)
  const focus = active === null ? null : slices[active]
  return (
    <div className="grid items-center gap-6 sm:grid-cols-[11rem_minmax(0,1fr)]">
      <ChartFrame className="relative mx-auto size-44" summary={`Sales by category, ${money(total)} in total: ${slices.map((s) => `${s.label} ${pct(s.value)}%`).join(", ")}.`}
        table={{ caption: "Sales by category", head: ["Category", "Sales", "Share"], rows: slices.map((s) => [s.label, money(s.value), `${pct(s.value)}%`]) }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 176, height: 176 }}>
          <PieChart>
            <Tooltip isAnimationActive={false} content={({ active: a, payload }: TooltipContentProps) => {
              const s = a ? (payload?.[0]?.payload as Slice | undefined) : undefined
              return s ? <TipCard title={s.label} rows={[{ label: "Sales", value: money(s.value) }, { label: "Share", value: `${pct(s.value)}%` }]} /> : null
            }} />
            <Pie data={slices} dataKey="value" nameKey="label" innerRadius="66%" outerRadius="100%" paddingAngle={2} cornerRadius={3} stroke={C.card} strokeWidth={2} startAngle={90} endAngle={-270}
              isAnimationActive={!reduced} animationDuration={900} onMouseEnter={(_, i) => setActive(i)} onMouseLeave={() => setActive(null)}>
              {slices.map((s, i) => <Cell key={s.label} fill={C.series[i % C.series.length]} fillOpacity={active === null || active === i ? 1 : 0.3} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="font-display text-2xl font-medium leading-none">{moneyCompact(focus ? focus.value : total)}</p>
          <p className="desk-eyebrow mt-1.5 max-w-24 truncate">{focus ? focus.label : centerLabel}</p>
        </div>
      </ChartFrame>
      <ul className="grid min-w-0 gap-0.5 text-sm">
        {slices.map((s, i) => (
          <li key={s.label} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
            className={`flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors ${active === i ? "bg-muted" : ""}`}>
            <span className="flex min-w-0 items-center gap-2"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-sm" style={{ background: C.series[i % C.series.length] }} /><span className="min-w-0"><span className="block truncate">{s.label}</span><span className="price block text-xs text-muted-foreground">{moneyCompact(s.value)}</span></span></span>
            <span className="price shrink-0 font-semibold">{pct(s.value)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------- top products
export type ProductBar = { label: string; revenue: number; units: number }

/** Splits a name into at most two lines of `max` characters, breaking at spaces; the full name stays in the <title>. */
function wrapName(text: string, max: number): string[] {
  if (text.length <= max) return [text]
  const words = text.split(" ")
  let first = ""
  while (words.length && (first + " " + words[0]).trim().length <= max) first = `${first} ${words.shift()}`.trim()
  if (!first) { first = text.slice(0, max); words.splice(0, words.length, text.slice(max)) }
  const rest = words.join(" ")
  return [first, ...(rest ? [rest.length > max ? `${rest.slice(0, max - 1)}…` : rest] : [])]
}

function ProductTick({ x = 0, y = 0, payload, rows, max }: { x?: number; y?: number; payload?: { value: string }; rows: ProductBar[]; max: number }) {
  const row = rows.find((r) => r.label === payload?.value)
  const text = payload?.value ?? ""
  const lines = wrapName(text, max)
  const top = -((lines.length) * 14) / 2 + 3
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{text}</title>
      {lines.map((l, i) => <text key={i} x={-8} y={top + i * 14 + 8} textAnchor="end" fontSize={12} fontWeight={500} fill="var(--foreground)">{l}</text>)}
      <text x={-8} y={top + lines.length * 14 + 8} textAnchor="end" fontSize={11} fill={C.axis}>{row ? `${number(row.units)} ${row.units === 1 ? "unit" : "units"}` : ""}</text>
    </g>
  )
}

/** Top products by revenue as horizontal bars, with units sold under each name. */
export function TopProducts({ rows }: { rows: ProductBar[] }) {
  const reduced = useReducedMotion(), wide = useWide()
  const max = wide ? 27 : 14
  return (
    <ChartFrame className="" summary={`Top products by revenue: ${rows.map((r) => `${r.label} ${money(r.revenue)}, ${r.units} units`).join("; ")}.`}
      table={{ caption: "Top products", head: ["Product", "Revenue", "Units"], rows: rows.map((r) => [r.label, money(r.revenue), r.units]) }}>
      <div style={{ height: rows.length * 56 + 8 }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: rows.length * 56 }}>
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 56, left: 0, bottom: 0 }} barCategoryGap="30%">
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis type="category" dataKey="label" width={wide ? 210 : 116} tickLine={false} axisLine={false} interval={0} tick={<ProductTick rows={rows} max={max} />} />
            <Tooltip isAnimationActive={false} cursor={{ fill: C.accentSoft }} content={({ active, payload }: TooltipContentProps) => {
              const r = active ? (payload?.[0]?.payload as ProductBar | undefined) : undefined
              return r ? <TipCard title={r.label} rows={[{ label: "Revenue", value: money(r.revenue) }, { label: "Units sold", value: number(r.units) }]} /> : null
            }} />
            <Bar dataKey="revenue" barSize={12} radius={[0, 3, 3, 0]} background={{ fill: C.grid, radius: 3 }} isAnimationActive={!reduced} animationDuration={800}>
              {rows.map((r, i) => <Cell key={r.label} fill={i === 0 ? C.accent : "var(--desk-2)"} />)}
              <LabelList dataKey="revenue" position="right" offset={8} formatter={(v: unknown) => moneyCompact(Number(v))} style={{ fontSize: 12, fontWeight: 600, fill: "var(--foreground)" }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartFrame>
  )
}

// ---------------------------------------------------------------- order status
export type StatusSlice = { key: string; label: string; n: number; color: string }

/** Every order in one stacked bar, then a legend whose rows link to the filtered order list. */
export function StatusStack({ items }: { items: StatusSlice[] }) {
  const reduced = useReducedMotion()
  const total = items.reduce((t, s) => t + s.n, 0)
  const row: Record<string, number> = Object.fromEntries(items.map((s) => [s.key, s.n]))
  return (
    <div className="grid gap-4">
      <ChartFrame className="h-9" summary={`${total} orders by status: ${items.map((s) => `${s.label} ${s.n}`).join(", ")}.`}
        table={{ caption: "Orders by status", head: ["Status", "Orders"], rows: items.map((s) => [s.label, s.n]) }}>
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 360, height: 36 }}>
          <BarChart data={[row]} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }} accessibilityLayer={false}>
            <XAxis type="number" hide domain={[0, total || 1]} /><YAxis type="category" hide dataKey={() => "orders"} />
            <Tooltip isAnimationActive={false} cursor={false} content={({ active, payload }: TooltipContentProps) => {
              const p = active ? payload?.[0] : undefined
              const s = items.find((x) => x.key === p?.dataKey)
              return s ? <TipCard title={s.label} rows={[{ label: "Orders", value: number(s.n) }, { label: "Share", value: `${Math.round((s.n / (total || 1)) * 100)}%` }]} /> : null
            }} />
            {items.map((s) => <Bar key={s.key} dataKey={s.key} stackId="status" fill={s.color} stroke={C.card} strokeWidth={2} radius={2} isAnimationActive={!reduced} animationDuration={800} />)}
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>
      <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        {items.map((s) => (
          <li key={s.key}>
            <Link href={`/admin/orders?status=${s.key}`} className="flex items-center justify-between gap-3 rounded-md px-1.5 py-1 transition-colors hover:bg-muted">
              <span className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 rounded-sm" style={{ background: s.color }} />{s.label}</span>
              <span className="price font-medium">{number(s.n)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------- weekday rhythm
export type DayBar = { day: string; full: string; n: number }

/** Orders by weekday over the last 90 days. The busiest day is the only one in crimson. */
export function WeekdayBars({ days }: { days: DayBar[] }) {
  const reduced = useReducedMotion()
  const total = days.reduce((t, d) => t + d.n, 0)
  const peak = days.reduce((b, d, i) => (d.n > days[b].n ? i : b), 0)
  return (
    <ChartFrame className="h-44" summary={`Orders by weekday over the last 90 days. Busiest: ${days[peak].full} with ${days[peak].n} of ${total}.`}
      table={{ caption: "Orders by weekday, last 90 days", head: ["Weekday", "Orders"], rows: days.map((d) => [d.full, d.n]) }}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 176 }}>
        <BarChart data={days} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} barCategoryGap="24%">
          <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} tickMargin={8} interval={0} />
          <YAxis hide domain={[0, (max: number) => Math.max(max, 1)]} />
          <Tooltip isAnimationActive={false} cursor={{ fill: C.accentSoft }} content={({ active, payload }: TooltipContentProps) => {
            const d = active ? (payload?.[0]?.payload as DayBar | undefined) : undefined
            return d ? <TipCard title={d.full} rows={[{ label: "Orders", value: number(d.n) }, { label: "Share", value: `${total ? Math.round((d.n / total) * 100) : 0}%` }]} /> : null
          }} />
          <Bar dataKey="n" radius={[3, 3, 0, 0]} minPointSize={2} isAnimationActive={!reduced} animationDuration={800}>
            {days.map((d, i) => <Cell key={d.day} fill={i === peak ? C.accent : "var(--desk-6)"} />)}
            <LabelList dataKey="n" position="top" style={{ fontSize: 11, fill: C.axis }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
