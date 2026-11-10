import { z } from "zod"

/** What a customer can pick as the reason for a return. Shared by the form and the server. */
export const RETURN_REASONS = ["Changed my mind", "Wrong item received", "Item arrived damaged", "Not as described", "Wrong size or fit", "Other"] as const
export type ReturnReason = (typeof RETURN_REASONS)[number]
export const RETURN_NOTE_MAX = 500

/** Returns in these states still count against what the customer bought; rejected and cancelled ones free the units again. */
export const LIVE_RETURN_STATUSES = ["requested", "approved", "received", "refunded"] as const

/** The customer's request: which order lines, how many units, why. Amounts are never taken from the client. */
export const createReturnBody = z.object({
  items: z.array(z.object({ orderItemId: z.string().uuid("Invalid item."), quantity: z.number().int().min(1).max(100) })).min(1, "Pick at least one item.").max(50),
  reason: z.enum(RETURN_REASONS),
  note: z.string().trim().max(RETURN_NOTE_MAX, `Keep the note under ${RETURN_NOTE_MAX} characters.`).optional(),
}).superRefine((v, ctx) => {
  if (v.reason === "Other" && !v.note) ctx.addIssue({ code: "custom", path: ["note"], message: "Tell us what went wrong." })
  if (new Set(v.items.map((i) => i.orderItemId)).size !== v.items.length) ctx.addIssue({ code: "custom", path: ["items"], message: "Each item can only be listed once." })
})

export type RefundLine = { unitPricePaise: number; quantity: number }

/**
 * What one line of an order is worth after its share of the order discount. The discount is spread over lines
 * in proportion to their value, exactly as lib/pricing.ts `quote` does it. Shipping is never part of this.
 */
export function lineNetPaise(line: RefundLine, lines: RefundLine[], discountPaise: number): number {
  const subtotal = lines.reduce((s, l) => s + l.unitPricePaise * l.quantity, 0)
  const gross = line.unitPricePaise * line.quantity
  const share = subtotal === 0 ? 0 : Math.round((gross / subtotal) * discountPaise)
  return gross - share
}

/** Refund for `units` of one line: its net value pro rata, rounded to the paisa. */
export const refundForUnits = (lineNet: number, bought: number, units: number) => Math.round((lineNet * units) / bought)
