import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Sparkline } from "./charts"

const tones = { green: "bg-emerald-100 text-emerald-700", blue: "bg-blue-100 text-blue-700", amber: "bg-amber-100 text-amber-700", violet: "bg-violet-100 text-violet-700", rose: "bg-rose-100 text-rose-700" } as const

export function KpiCard({ label, value, deltaPct, spark, icon: Icon, tone, note }: {
  label: string; value: string; deltaPct?: number; spark?: number[]; icon: LucideIcon; tone: keyof typeof tones; note?: string
}) {
  const up = (deltaPct ?? 0) >= 0
  return (
    <div className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="price mt-1 text-2xl font-bold tracking-tight">{value}</p></div>
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-5" aria-hidden="true" /></span>
      </div>
      {spark && <Sparkline data={spark} className={up ? "text-emerald-600" : "text-rose-600"} />}
      <p className="flex items-center gap-1.5 text-xs">
        {deltaPct !== undefined && (
          <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold ${up ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
            {up ? <ArrowUpRight className="size-3" aria-hidden="true" /> : <ArrowDownRight className="size-3" aria-hidden="true" />}{Math.abs(deltaPct).toFixed(1)}%
          </span>
        )}
        <span className="text-muted-foreground">{note ?? "vs previous period"}</span>
      </p>
    </div>
  )
}
