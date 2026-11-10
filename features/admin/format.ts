import { formatMoney } from "@/lib/money"

export const money = (paise: number) => formatMoney(paise, undefined, undefined, { hideZeroDecimals: true })
/** Compact rupees for charts and tiles: ₹12.4L, ₹3.2Cr. */
export const moneyCompact = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 }).format(paise / 100)
export const number = (n: number) => new Intl.NumberFormat("en-IN").format(n)

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
const dateTime = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })
export const fmtDate = (iso: string) => date.format(new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso))
export const fmtDateTime = (iso: string) => dateTime.format(new Date(iso))

/** Today's date in India (YYYY-MM-DD). Call it on the server and pass it down; see features/admin/today.tsx. */
export const istToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date())
