"use client"
import { useEffect, useRef } from "react"
import { productById } from "@/features/catalog/demo"
import { trackViewItem } from "./events"

/** Fires view_item once per product page view. Renders nothing. */
export function ViewItemEvent({ productId }: { productId: string }) {
  const sent = useRef<string | null>(null)
  useEffect(() => {
    if (sent.current === productId) return
    sent.current = productId
    const p = productById(productId)
    if (p) trackViewItem(p)
  }, [productId])
  return null
}
