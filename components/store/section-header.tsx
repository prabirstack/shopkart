import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"

export function SectionHeader({
  id, title, href, linkLabel, children,
}: {
  id: string
  title: ReactNode
  href?: string
  linkLabel?: string
  /** Extra content next to the title, e.g. a countdown or a short note. */
  children?: ReactNode
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={id} className="section-title flex items-center gap-2"><span aria-hidden="true" className="h-6 w-1 shrink-0 rounded-full bg-primary" />{title}</h2>
        {children}
      </div>
      {href && (
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          {linkLabel} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
