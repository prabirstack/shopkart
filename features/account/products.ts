import "server-only"

import { getProductsByIds } from "@/features/catalog/data"
import type { OrderDTO } from "@/lib/db/queries/types"

export type ProductHint = { slug: string; category: string }

/**
 * Orders keep a snapshot of each item, not the live product. To link to the product page and pick a
 * thumbnail we look the products up by id; ones that no longer exist (archived or deleted) are simply absent.
 */
export async function productHints(orders: Pick<OrderDTO, "items">[]): Promise<Record<string, ProductHint>> {
  const ids = [...new Set(orders.flatMap((o) => o.items.map((i) => i.productId)))].sort()
  if (ids.length === 0) return {}
  const found = await getProductsByIds(ids)
  return Object.fromEntries(found.map((p) => [p.id, { slug: p.slug, category: p.category }]))
}

/** Thumbnail inputs for an order's items. */
export const thumbsOf = (order: Pick<OrderDTO, "items">, hints: Record<string, ProductHint>) =>
  order.items.map((i) => ({ productId: i.productId, slug: hints[i.productId]?.slug, category: hints[i.productId]?.category }))
