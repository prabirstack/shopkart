import { ChevronDown, Globe, MapPin, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { formatMoney } from "@/lib/money"
import { DELIVERY_CITY, FREE_DELIVERY_ABOVE_PAISE } from "@/lib/store-config"

export function UtilityBar() {
  return (
    <div className="bg-foreground text-xs text-background">
      <div className="store-container flex h-9 items-center justify-between gap-4">
        <p className="flex items-center gap-1.5">
          <MapPin className="size-3.5" aria-hidden="true" />
          Deliver to {DELIVERY_CITY}
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </p>
        <ul className="hidden items-center gap-8 md:flex">
          <li className="flex items-center gap-1.5">
            <Truck className="size-4" aria-hidden="true" />
            Free Delivery above {formatMoney(FREE_DELIVERY_ABOVE_PAISE, undefined, undefined, { hideZeroDecimals: true })}
          </li>
          <li className="flex items-center gap-1.5">
            <RotateCcw className="size-4" aria-hidden="true" /> Easy Returns
          </li>
          <li className="flex items-center gap-1.5">
            <ShieldCheck className="size-4" aria-hidden="true" /> Secure Payments
          </li>
        </ul>
        <p className="flex items-center gap-1.5">
          <Globe className="size-3.5" aria-hidden="true" /> English
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </p>
      </div>
    </div>
  )
}
