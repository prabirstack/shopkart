import { Headphones, Package, ShieldCheck, Truck, type LucideIcon } from "lucide-react"
import { formatMoney } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE, RETURN_WINDOW_DAYS } from "@/lib/store-config"

function TrustItem({ icon: Icon, label, note }: { icon: LucideIcon; label: string; note: string }) {
  return (
    <li className="flex items-center gap-3 px-3 py-3">
      <Icon className="size-8 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
    </li>
  )
}

export function TrustStrip() {
  return (
    <ul className="grid grid-cols-2 divide-x rounded-xl bg-muted lg:grid-cols-4 [&>li:nth-child(n+3)]:border-t lg:[&>li:nth-child(n+3)]:border-t-0">
      <TrustItem icon={Truck} label="Free Delivery" note={`above ${formatMoney(FREE_DELIVERY_ABOVE_PAISE, undefined, undefined, { hideZeroDecimals: true })}`} />
      <TrustItem icon={Package} label="Easy Returns" note={`${RETURN_WINDOW_DAYS}-day hassle free`} />
      <TrustItem icon={ShieldCheck} label="Secure Payments" note="Safe & encrypted" />
      <TrustItem icon={Headphones} label="24/7 Support" note="We're always here" />
    </ul>
  )
}
