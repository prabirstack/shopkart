import * as React from "react"
import { cn } from "cn"

import { formatMoney } from "@/lib/money"

type PriceProps = Omit<React.ComponentProps<"span">, "children"> & {
  /** Current selling price in integer minor units (paise for INR). */
  cents: number
  /** Original price in minor units; shown struck through when higher than `cents`. */
  compareAtCents?: number | null
  currency?: string
  locale?: string
}

function Price({
  cents,
  compareAtCents,
  currency,
  locale,
  className,
  ...props
}: PriceProps) {
  const hasDiscount = compareAtCents != null && compareAtCents > cents
  const discountPercent = hasDiscount
    ? Math.round(((compareAtCents - cents) / compareAtCents) * 100)
    : 0

  return (
    <span
      data-slot="price"
      className={cn("price inline-flex flex-wrap items-baseline gap-x-2", className)}
      {...props}
    >
      <span className="font-semibold text-foreground">
        <span className="sr-only">Price: </span>
        {formatMoney(cents, currency, locale)}
      </span>
      {hasDiscount && (
        <>
          <del className="text-sm text-muted-foreground">
            <span className="sr-only">Original price: </span>
            {formatMoney(compareAtCents, currency, locale)}
          </del>
          <span className="text-sm font-medium text-primary">
            {discountPercent}% off
          </span>
        </>
      )}
    </span>
  )
}

export { Price }
export type { PriceProps }
