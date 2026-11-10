"use client"
import { useSyncExternalStore } from "react"

export type Consent = "granted" | "denied" | null
const KEY = "shopkart-consent"
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function readConsent(): Consent {
  try { const v = localStorage.getItem(KEY); return v === "granted" || v === "denied" ? v : null } catch { return null }
}

export function setConsent(value: Consent) {
  try { if (value === null) localStorage.removeItem(KEY); else localStorage.setItem(KEY, value) } catch { /* storage blocked: choice lasts until reload */ }
  emit()
}

/** null on the server and until the visitor chooses. Re-renders on changes in any tab or component. */
export function useConsent(): Consent | undefined {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); window.addEventListener("storage", cb); return () => { listeners.delete(cb); window.removeEventListener("storage", cb) } },
    readConsent,
    () => undefined, // undefined = not known yet (server render / hydration)
  )
}
