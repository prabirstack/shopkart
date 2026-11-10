import { TIMELINE, stepsDone, type OrderStatus } from "@/features/account/orders"

/** Thin progress bar with the current step named. */
export function OrderProgress({ order }: { order: { status: OrderStatus; events: { status: string }[] } }) {
  const done = stepsDone(order)
  const label = TIMELINE[Math.min(done, TIMELINE.length) - 1].label
  return (
    <div className="grid gap-1.5">
      <div role="progressbar" aria-label="Order progress" aria-valuemin={0} aria-valuemax={TIMELINE.length} aria-valuenow={done} aria-valuetext={label}
        className="h-2 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${(done / TIMELINE.length) * 100}%` }} /></div>
      <div className="flex justify-between text-xs text-muted-foreground">{TIMELINE.map((t, i) => <span key={t.status} className={`${i < done ? "font-medium text-foreground" : ""} ${i > 0 && i < TIMELINE.length - 1 ? "hidden sm:inline" : ""}`}>{t.label}</span>)}</div>
    </div>
  )
}
