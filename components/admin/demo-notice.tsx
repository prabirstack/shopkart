import { Info } from "lucide-react"

/** Reminder that this admin screen still runs on sample data (access control itself is real). */
export function DemoNotice() {
  return (
    <p role="note" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>Sample data. Access to this console is protected by sign-in and roles, but the records shown here are demo data kept in your browser, not the database yet.</span>
    </p>
  )
}
