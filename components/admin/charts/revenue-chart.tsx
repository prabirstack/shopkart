"use client"
import { useId } from "react"
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts"
import { AXIS_TICK, C, ChartFrame, DeltaText, TipCard, useReducedMotion, type TipRow } from "./shared"
import { delta, formatShortDate } from "@/features/admin/analytics"
import { money, moneyCompact, number } from "@/features/admin/format"
import type { SalesDay } from "@/lib/db/queries/admin-reports"

type Row = { date: string; label: string; value: number; orders: number; prev: number | null; prevLabel: string | null; prevOrders: number | null }

/** Pairs each day with the same position in the previous period, so the dashed line and the tooltip can compare them. */
function pair(cur: SalesDay[], prev: SalesDay[]): Row[] {
  return cur.map((d, i) => ({ date: d.date, label: formatShortDate(d.date), value: d.revenue, orders: d.orders, prev: prev[i]?.revenue ?? null, prevLabel: prev[i] ? formatShortDate(prev[i].date) : null, prevOrders: prev[i]?.orders ?? null }))
}

function RevenueTip({ active, payload }: TooltipContentProps) {
  const row = active ? (payload?.[0]?.payload as Row | undefined) : undefined
  if (!row) return null
  const pct = row.prev ? delta(row.value, row.prev) : null
  const rows: TipRow[] = [{ label: row.label, value: money(row.value), color: C.accent }]
  if (row.prev !== null) rows.push({ label: row.prevLabel ?? "Previous", value: money(row.prev), color: C.axis })
  return <TipCard title={`${row.orders} ${row.orders === 1 ? "order" : "orders"}`} rows={rows} footer={row.prev !== null ? <p className="flex justify-between gap-4 text-muted-foreground">vs previous period <DeltaText pct={pct} /></p> : undefined} />
}

/** Peak-day note. Anchored to the left of the dot when the peak sits near the right edge, so it never clips. */
function PeakLabel({ viewBox, text, flip }: { viewBox?: { x?: number; y?: number }; text: string; flip: boolean }) {
  const x = viewBox?.x ?? 0, y = viewBox?.y ?? 0
  return (
    <g>
      <line x1={x} x2={x} y1={y - 4} y2={y - 14} stroke={C.accent} strokeWidth={1} />
      <text x={flip ? x + 6 : x - 6} y={y - 18} textAnchor={flip ? "end" : "start"} fontSize={11} fontWeight={600} fill={C.accent}>{text}</text>
    </g>
  )
}

/** The centrepiece: this period as a soft area, the previous period as a dashed line, a crosshair and a peak-day note. */
export function RevenueChart({ cur, prev }: { cur: SalesDay[]; prev: SalesDay[] }) {
  const id = useId().replace(/:/g, "")
  const reduced = useReducedMotion()
  const data = pair(cur, prev)
  const peakIdx = data.reduce((best, r, i) => (r.value > data[best].value ? i : best), 0)
  const peak = data[peakIdx]
  const total = data.reduce((t, r) => t + r.value, 0)
  const summary = `Revenue by day, ${data[0].label} to ${data.at(-1)!.label}: ${money(total)} in total. Best day ${peak.label} at ${money(peak.value)}.`
  const hasPrev = prev.length > 0 && prev.some((d) => d.revenue > 0)
  return (
    <ChartFrame summary={summary} className="h-72 sm:h-80" table={{ caption: "Revenue and orders by day", head: ["Day", "Revenue", "Orders", "Previous period revenue"], rows: data.map((r) => [r.label, money(r.value), r.orders, r.prev === null ? "" : money(r.prev)]) }}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 720, height: 300 }}>
        <ComposedChart data={data} margin={{ top: 34, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`rev-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" style={{ stopColor: C.accent, stopOpacity: 0.3 }} /><stop offset="100%" style={{ stopColor: C.accent, stopOpacity: 0 }} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={C.grid} strokeDasharray="2 5" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: C.grid }} tickMargin={10} minTickGap={28} interval="preserveStartEnd" />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={50} tickCount={5} tickFormatter={(v: number) => moneyCompact(v)} domain={[0, (max: number) => Math.max(max, 100) * 1.08]} />
          <Tooltip content={RevenueTip} cursor={{ stroke: C.ink, strokeOpacity: 0.45, strokeDasharray: "3 3" }} isAnimationActive={false} />
          {hasPrev && <Line dataKey="prev" type="linear" stroke={C.axis} strokeOpacity={0.7} strokeWidth={1.25} strokeDasharray="4 4" dot={false} activeDot={false} isAnimationActive={!reduced} animationDuration={900} />}
          <Area dataKey="value" type="linear" stroke={C.accent} strokeWidth={1.75} fill={`url(#rev-${id})`} dot={false} activeDot={{ r: 5, fill: C.accent, stroke: C.card, strokeWidth: 2 }} isAnimationActive={!reduced} animationDuration={900} animationEasing="ease-out" />
          {peak.value > 0 && (
            <ReferenceDot x={peak.label} y={peak.value} r={4} fill={C.card} stroke={C.accent} strokeWidth={2} ifOverflow="visible"
              label={(p: { viewBox?: { x?: number; y?: number } }) => <PeakLabel viewBox={p.viewBox} text={`Best day: ${peak.label}, ${money(peak.value)}`} flip={peakIdx > data.length * 0.6} />} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

function OrdersTip({ active, payload }: TooltipContentProps) {
  const row = active ? (payload?.[0]?.payload as Row | undefined) : undefined
  if (!row) return null
  const rows: TipRow[] = [{ label: row.label, value: number(row.orders), color: C.ink }]
  if (row.prevOrders !== null) rows.push({ label: row.prevLabel ?? "Previous", value: number(row.prevOrders), color: C.axis })
  return <TipCard title="Orders" rows={rows} footer={row.prevOrders ? <p className="flex justify-between gap-4 text-muted-foreground">vs previous period <DeltaText pct={delta(row.orders, row.prevOrders)} /></p> : undefined} />
}

/** Orders per day, drawn as thin columns so it sits under the revenue chart as a second reading of the same days. */
export function OrdersChart({ cur, prev }: { cur: SalesDay[]; prev: SalesDay[] }) {
  const reduced = useReducedMotion()
  const data = pair(cur, prev)
  const maxIdx = data.reduce((best, r, i) => (r.orders > data[best].orders ? i : best), 0)
  const total = data.reduce((t, r) => t + r.orders, 0)
  return (
    <ChartFrame summary={`Orders per day: ${total} in total, most on ${data[maxIdx].label} (${data[maxIdx].orders}).`} className="h-24 sm:h-28">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 720, height: 90 }}>
        <BarChart data={data} margin={{ top: 10, right: 16, left: 50, bottom: 0 }} barCategoryGap="22%">
          <XAxis dataKey="label" hide />
          <YAxis hide domain={[0, (max: number) => Math.max(max, 1)]} />
          <Tooltip content={OrdersTip} cursor={{ fill: C.accentSoft }} isAnimationActive={false} />
          <Bar dataKey="orders" fill={C.ink} fillOpacity={0.55} radius={[2, 2, 0, 0]} minPointSize={2} isAnimationActive={!reduced} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}
