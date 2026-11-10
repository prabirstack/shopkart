import type { CustomerReturnDTO } from "@/lib/db/queries/returns-customer"

// What each return status is called for the customer, and which badge colour it gets.
export type ReturnStatus = CustomerReturnDTO["status"]

export const RETURN_LABEL: Record<ReturnStatus, string> = {
  requested: "Requested", approved: "Approved", received: "Received", refunded: "Refunded", rejected: "Not accepted", cancelled: "Cancelled",
}
export const RETURN_TONE: Record<ReturnStatus, "info" | "warn" | "good" | "muted" | "bad"> = {
  requested: "warn", approved: "info", received: "info", refunded: "good", rejected: "bad", cancelled: "muted",
}
/** One line telling the customer what happens next. */
export const RETURN_NEXT: Record<ReturnStatus, string> = {
  requested: "We'll review your request shortly.",
  approved: "Approved. Send the items back to us; we'll refund you once they arrive.",
  received: "We have your items. Your refund is being processed.",
  refunded: "Refunded to your original payment method. Banks can take a few days to show it.",
  rejected: "We couldn't accept this return. Contact support if you think that's a mistake.",
  cancelled: "You cancelled this request.",
}
