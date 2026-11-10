import { productById } from "@/features/catalog/demo"

/** Overlapping product tiles for an order. Placeholder icons until real photos exist. */
export function OrderThumbs({ productIds, size = "size-11" }: { productIds: string[]; size?: string }) {
  const shown = productIds.slice(0, 3)
  const extra = productIds.length - shown.length
  return (
    <span className="flex -space-x-3" aria-hidden="true">
      {shown.map((id) => {
        const Icon = productById(id)?.icon
        return <span key={id} className={`grid ${size} place-items-center rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-200 ring-2 ring-card`}>{Icon && <Icon className="size-1/2 text-neutral-700" strokeWidth={1.4} />}</span>
      })}
      {extra > 0 && <span className={`grid ${size} place-items-center rounded-xl bg-muted text-xs font-semibold ring-2 ring-card`}>+{extra}</span>}
    </span>
  )
}
