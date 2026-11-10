/** An expected business failure (out of stock, bad coupon, duplicate review). Safe to show to users. */
export class DomainError extends Error {
  constructor(public readonly code: string, message: string) { super(message); this.name = "DomainError" }
}

/** Finds the Postgres error code (like 23505 unique, 23514 check) even when a driver wraps the error. */
export function pgCode(err: unknown): string | undefined {
  for (let e: unknown = err, i = 0; e && i < 5; e = (e as { cause?: unknown }).cause, i++) {
    const code = (e as { code?: unknown }).code
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code
  }
  return undefined
}
export const isUniqueViolation = (e: unknown) => pgCode(e) === "23505"
export const isCheckViolation = (e: unknown) => pgCode(e) === "23514"

/** Name of the constraint a Postgres error came from (for example "coupon_redemptions_user_idx"). */
export function pgConstraint(err: unknown): string | undefined {
  for (let e: unknown = err, i = 0; e && i < 5; e = (e as { cause?: unknown }).cause, i++) {
    const c = (e as { constraint?: unknown }).constraint
    if (typeof c === "string") return c
  }
  return undefined
}
