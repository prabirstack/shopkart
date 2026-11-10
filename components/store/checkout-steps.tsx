import { Check } from "lucide-react"

const steps = ["Cart", "Details & payment", "Confirmation"]

/** Shows where the shopper is in the purchase. `current` is the zero-based step; 3 means all done. */
export function CheckoutSteps({ current }: { current: 0 | 1 | 2 | 3 }) {
  return (
    <ol aria-label="Checkout progress" className="flex items-center gap-2 text-sm sm:gap-3">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-3" aria-current={active ? "step" : undefined}>
            <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${done ? "bg-emerald-600 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {done ? <Check className="size-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={`${active ? "font-semibold" : done ? "" : "text-muted-foreground"} ${active ? "" : "hidden sm:inline"}`}>{label}<span className="sr-only">{done ? " (completed)" : active ? " (current step)" : ""}</span></span>
            {i < steps.length - 1 && <span aria-hidden="true" className={`h-px w-6 sm:w-12 ${done ? "bg-emerald-600" : "bg-border"}`} />}
          </li>
        )
      })}
    </ol>
  )
}
