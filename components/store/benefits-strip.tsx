import { BadgeCheck, CreditCard, RotateCcw, Truck, Zap, type LucideIcon } from "lucide-react"

const items: { icon: LucideIcon; label: string; note: string }[] = [
  { icon: Zap, label: "Great Deals", note: "On top brands" },
  { icon: BadgeCheck, label: "Genuine Products", note: "100% authentic" },
  { icon: CreditCard, label: "Secure Payments", note: "Safe checkout" },
  { icon: Truck, label: "Fast Delivery", note: "Across India" },
  { icon: RotateCcw, label: "Easy Returns", note: "Hassle-free" },
]

export function BenefitsStrip() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-xl bg-foreground p-4 text-background sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ icon: Icon, label, note }) => (
        <li key={label} className="flex items-center gap-3">
          <Icon className="size-7 shrink-0 text-amber-400" strokeWidth={1.5} aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-background/70">{note}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
