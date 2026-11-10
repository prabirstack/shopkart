import { TIMELINE, progressFor, type OrderStatus } from "@/features/account/demo"

/** Thin progress bar with the current step named. */
export function OrderProgress({ status }: { status: OrderStatus }) {
  const done = progressFor(status)
  const label = status === "refunded" ? "Refunded" : TIMELINE[Math.min(done, TIMELINE.length) - 1]
  return (
    <div className="grid gap-1.5">
      <div role="progressbar" aria-label="Order progress" aria-valuemin={0} aria-valuemax={TIMELINE.length} aria-valuenow={done} aria-valuetext={label}
        className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${(done / TIMELINE.length) * 100}%` }} /></div>
      <div className="flex justify-between text-xs text-muted-foreground">{TIMELINE.map((t, i) => <span key={t} className={`${i < done ? "font-medium text-foreground" : ""} ${i > 0 && i < TIMELINE.length - 1 ? "hidden sm:inline" : ""}`}>{t}</span>)}</div>
    </div>
  )
}
