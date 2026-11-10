import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ChevronRight } from "lucide-react"

const tones = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
  rose: "bg-rose-100 text-rose-700",
} as const

/** Number tile with a colour-coded icon chip. Links to the page it summarises. */
export function StatTile({ label, value, note, icon: Icon, tone, href }: {
  label: string; value: string; note?: string; icon: LucideIcon; tone: keyof typeof tones; href?: string
}) {
  const body = (
    <>
      <span className={`grid size-11 place-items-center rounded-xl ${tones[tone]}`}><Icon className="size-5" aria-hidden="true" /></span>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="price text-2xl font-bold leading-tight">{value}</span>
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </span>
      {href && <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />}
    </>
  )
  const cls = "group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs"
  return href
    ? <Link href={href} className={`${cls} transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50`}>{body}</Link>
    : <div className={cls}>{body}</div>
}
