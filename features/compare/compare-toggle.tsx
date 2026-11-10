"use client"
import { useState } from "react"
import { Check, GitCompareArrows } from "lucide-react"
import { track } from "@/features/analytics/track"
import { useCompareHydrated } from "./hooks"
import { MAX_COMPARE, useCompare } from "./store"

/** Adds or removes a product from the compare list. Max four, with a clear message when full. */
export function CompareToggle({ productId, title = "product", variant = "icon" }: { productId: string; /** Product name, used in the button label for screen readers. */ title?: string; variant?: "icon" | "button" }) {
  const ids = useCompare((s) => s.ids)
  const toggle = useCompare((s) => s.toggle)
  const hydrated = useCompareHydrated()
  const [note, setNote] = useState("")
  const on = hydrated && ids.includes(productId)
  const onClick = () => {
    const result = toggle(productId)
    setNote(result === "full" ? `You can compare up to ${MAX_COMPARE} products. Remove one first.` : result === "added" ? `${title} added to compare.` : `${title} removed from compare.`)
    if (result === "added") track("add_to_compare", { item_id: productId })
    window.setTimeout(() => setNote(""), 2500)
  }
  if (variant === "button") return (
    <>
      <button type="button" aria-pressed={on} onClick={onClick}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 ${on ? "border-primary text-primary" : ""}`}>
        {on ? <Check className="size-4" aria-hidden="true" /> : <GitCompareArrows className="size-4" aria-hidden="true" />}{on ? "Added to compare" : "Add to compare"}
      </button>
      <span role="status" className={note.includes("up to") ? "text-xs text-destructive" : "sr-only"}>{note}</span>
    </>
  )
  return (
    <>
      <button type="button" aria-pressed={on} aria-label={on ? `Remove ${title} from compare` : `Compare ${title}`} title={on ? "Remove from compare" : "Add to compare"} onClick={onClick}
        className={`grid size-8 place-items-center rounded-full shadow-sm transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 ${on ? "bg-primary text-primary-foreground opacity-100" : "bg-background/90 text-muted-foreground opacity-0 hover:text-primary group-hover/card:opacity-100 group-focus-within/card:opacity-100 [@media(hover:none)]:opacity-100"}`}>
        {on ? <Check className="size-4" aria-hidden="true" /> : <GitCompareArrows className="size-4" aria-hidden="true" />}
      </button>
      <span role="status" className="sr-only">{note}</span>
    </>
  )
}
