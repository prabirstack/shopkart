"use client"
import { ANALYTICS_DEBUG, ANALYTICS_ENABLED } from "./config"
import { readConsent } from "./consent"

declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void }
}

type Params = Record<string, unknown>

/**
 * Events fired on mount (view_item, purchase...) can run before gtag has initialised.
 * They wait here and are flushed by <Analytics /> once gtag is ready, so none are lost.
 */
const pending: [string, Params][] = []
const MAX_PENDING = 50

export function flushPending() {
  if (typeof window.gtag !== "function") return
  while (pending.length > 0) {
    const [event, params] = pending.shift()!
    window.gtag("event", event, params)
  }
}

/** The one place events leave the app. No consent or no GA ID means nothing is sent. */
export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return
  if (ANALYTICS_DEBUG) console.debug("[analytics]", event, params, { sent: ANALYTICS_ENABLED && readConsent() === "granted" })
  if (!ANALYTICS_ENABLED || readConsent() !== "granted") return
  if (typeof window.gtag !== "function") {
    if (pending.length < MAX_PENDING) pending.push([event, params])
    return
  }
  window.gtag("event", event, params)
}
