import { Info } from "lucide-react"

/** Shown until real authentication and permissions exist (course Phase C). */
export function DemoNotice() {
  return (
    <p role="note" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>Demo data. This page has no login or permission checks yet; never put real customer or business data here until the identity chapters are done.</span>
    </p>
  )
}
