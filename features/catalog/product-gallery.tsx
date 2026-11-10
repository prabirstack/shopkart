"use client"
import { useState } from "react"
import { productById } from "./demo"

/** Placeholder gallery: swap the icon tiles for next/image once licensed photos exist. */
export function ProductGallery({ productId, badge }: { productId: string; badge?: string }) {
  // Icons are functions and cannot cross the server/client boundary, so look the product up here.
  const product = productById(productId)!
  const Icon = product.icon
  const title = product.title
  const views = ["Front", "Side", "Back", "In use"]
  const [active, setActive] = useState(0)
  return (
    <div className="grid gap-3">
      <div className="relative grid aspect-square place-items-center rounded-2xl bg-neutral-100">
        {badge && <span className="absolute left-4 top-4 rounded-md bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">{badge}</span>}
        <Icon className="size-1/3 text-neutral-700" strokeWidth={1} aria-hidden="true" />
        <span className="absolute bottom-3 right-3 rounded-full bg-background/90 px-3 py-1 text-xs text-muted-foreground">{views[active]} view</span>
      </div>
      <ul className="grid grid-cols-4 gap-3">
        {views.map((v, i) => (
          <li key={v}>
            <button type="button" onClick={() => setActive(i)} aria-label={`Show ${v.toLowerCase()} view of ${title}`} aria-pressed={active === i}
              className={`grid aspect-square w-full place-items-center rounded-xl bg-neutral-100 focus-visible:ring-[3px] focus-visible:ring-ring/50 ${active === i ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-border"}`}>
              <Icon className="size-1/3 text-neutral-500" strokeWidth={1} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
