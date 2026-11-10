"use client"
import { useEffect } from "react"
import { trackPurchase } from "./events"

type OrderProps = {
  orderId: string; totalPaise: number; gstPaise: number; shippingPaise: number; coupon: string | null
  lines: { id: string; title: string; pricePaise: number; quantity: number }[]
}

/** Fires purchase once per order (guarded in sessionStorage so a refresh can't double count). */
export function PurchaseEvent(o: OrderProps) {
  useEffect(() => {
    const key = `purchase-sent-${o.orderId}`
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1") } catch { /* private mode: accept a rare double fire */ }
    trackPurchase({ orderId: o.orderId, totalPaise: o.totalPaise, gstPaise: o.gstPaise, shippingPaise: o.shippingPaise, coupon: o.coupon,
      lines: o.lines.map((l) => ({ product: { id: l.id, title: l.title, pricePaise: l.pricePaise }, quantity: l.quantity })) })
  }, [o.orderId, o.totalPaise, o.gstPaise, o.shippingPaise, o.coupon, o.lines])
  return null
}
