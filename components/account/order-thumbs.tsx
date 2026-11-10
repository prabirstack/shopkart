import { ProductArt } from "@/components/store/product-art"

export type ThumbItem = { productId: string; slug?: string; category?: string }

/** Overlapping product tiles for an order. Products that no longer exist show a neutral icon. */
export function OrderThumbs({ items, size = "size-11" }: { items: ThumbItem[]; size?: string }) {
  const shown = items.slice(0, 3)
  const extra = items.length - shown.length
  return (
    <span className="flex -space-x-3" aria-hidden="true">
      {shown.map((it) => (
        <span key={it.productId} className={`relative grid ${size} place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-200 ring-2 ring-card`}>
          <ProductArt slug={it.slug ?? ""} src={it.slug ? undefined : null} title="" category={it.category} sizes="56px" imageClassName="object-contain p-1.5" iconClassName="size-1/2 text-neutral-700" strokeWidth={1.4} />
        </span>
      ))}
      {extra > 0 && <span className={`grid ${size} place-items-center rounded-xl bg-muted text-xs font-semibold ring-2 ring-card`}>+{extra}</span>}
    </span>
  )
}
