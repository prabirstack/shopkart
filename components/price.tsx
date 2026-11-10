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
  /** Show "₹699" instead of "₹699.00" for whole-rupee amounts. Default true. */
  compact?: boolean
  /** Show the "% off" label next to a struck-through price. Default true. */
  showDiscountLabel?: boolean
  /** Classes for the current-price text, e.g. to colour it. */
  priceClassName?: string
}

function Price({
  cents,
  compareAtCents,
  currency,
  locale,
  compact = true,
  showDiscountLabel = true,
  priceClassName,
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
      <span className={cn("font-semibold text-foreground", priceClassName)}>
        <span className="sr-only">Price: </span>
        {formatMoney(cents, currency, locale, { hideZeroDecimals: compact })}
      </span>
      {hasDiscount && (
        <>
          <del className="text-sm text-muted-foreground">
            <span className="sr-only">Original price: </span>
            {formatMoney(compareAtCents, currency, locale, { hideZeroDecimals: compact })}
          </del>
          {showDiscountLabel && (
            <span className="text-sm font-medium text-primary">
              {discountPercent}% off
            </span>
          )}
        </>
      )}
    </span>
  )
}

export { Price }
export type { PriceProps }
