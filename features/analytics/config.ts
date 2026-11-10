/** GA4 measurement ID, e.g. G-XXXXXXXXXX. With no ID, no analytics script, banner or event is ever sent. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() || ""
export const ANALYTICS_ENABLED = /^G-[A-Z0-9]+$/.test(GA_ID)
/** Log events to the browser console (useful before an ID exists). Set NEXT_PUBLIC_ANALYTICS_DEBUG=1. */
export const ANALYTICS_DEBUG = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1"
