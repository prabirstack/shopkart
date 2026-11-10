"use client"
import { useEffect } from "react"
import { productById } from "@/features/catalog/demo"
import { trackPurchase } from "./events"

type OrderProps = { orderId: string; totalPaise: number; gstPaise: number; shippingPaise: number; coupon: string | null; lines: { id: string; quantity: number }[] }

/** Fires purchase once per order (guarded in sessionStorage so a refresh can't double count). */
export function PurchaseEvent(o: OrderProps) {
  useEffect(() => {
    const key = `purchase-sent-${o.orderId}`
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1") } catch { /* private mode: accept a rare double fire */ }
    const lines = o.lines.flatMap((l) => { const product = productById(l.id); return product ? [{ product, quantity: l.quantity }] : [] })
    trackPurchase({ orderId: o.orderId, totalPaise: o.totalPaise, gstPaise: o.gstPaise, shippingPaise: o.shippingPaise, coupon: o.coupon, lines })
  }, [o.orderId, o.totalPaise, o.gstPaise, o.shippingPaise, o.coupon, o.lines])
  return null
}
