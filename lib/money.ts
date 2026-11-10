/**
 * Money helpers. All amounts are integer minor units (cents; paise for INR) to avoid
 * floating-point errors. Only convert to decimals at the display edge.
 */

export const DEFAULT_CURRENCY = "INR";
export const DEFAULT_LOCALE = "en-IN";

function assertCents(cents: number): void {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`Expected integer cents, received ${cents}`);
  }
}

/** Convert a decimal amount (e.g. 19.99) to integer cents (1999). */
export function toCents(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new RangeError(`Invalid amount: ${amount}`);
  }
  return Math.round(amount * 100);
}

/** Convert integer cents (1999) to a decimal amount (19.99). */
export function fromCents(cents: number): number {
  assertCents(cents);
  return cents / 100;
}

/** Parse user input like "19.99" or "$1,299.50" into integer cents. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[^0-9.-]/g, "");
  if (!/^-?\d*\.?\d+$|^-?\d+\.$/.test(cleaned)) return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? toCents(value) : null;
}

/** Format integer cents for display, e.g. 129950 -> "₹1,299.50". */
export function formatMoney(
  cents: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
  options: { hideZeroDecimals?: boolean } = {},
): string {
  assertCents(cents);
  // Show "₹699" instead of "₹699.00" for whole-rupee amounts when asked.
  const whole = options.hideZeroDecimals && cents % 100 === 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    ...(whole && { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
  }).format(cents / 100);
}

export function addMoney(...amounts: number[]): number {
  return amounts.reduce((sum, c) => {
    assertCents(c);
    return sum + c;
  }, 0);
}

/** Multiply unit price by a whole-number quantity. */
export function multiplyMoney(cents: number, quantity: number): number {
  assertCents(cents);
  if (!Number.isInteger(quantity)) {
    throw new RangeError(`Quantity must be an integer, received ${quantity}`);
  }
  return cents * quantity;
}

/** Percentage of an amount, rounded to the nearest cent (e.g. tax, 8.5%). */
export function percentOf(cents: number, percent: number): number {
  assertCents(cents);
  return Math.round((cents * percent) / 100);
}

/** Apply a percentage discount; returns the discounted price in cents. */
export function applyDiscount(cents: number, percent: number): number {
  return cents - percentOf(cents, percent);
}
