"use client"
import { useEffect, useRef } from "react"
import type { GatewaySuccess } from "./mock-razorpay-dialog"

// Razorpay Standard Checkout (their hosted popup). Card, UPI and netbanking details are typed into THEIR window and
// never touch our server. We only receive the three values it returns, and the server verifies the signature.

type RazorpayInstance = { open: () => void; close: () => void; on: (event: string, cb: (r: { error?: { description?: string } }) => void) => void }
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance
declare global { interface Window { Razorpay?: RazorpayCtor } }

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js"
let loading: Promise<RazorpayCtor> | null = null

/** Loads Razorpay's script once, only when a payment is about to start. */
function loadRazorpay(): Promise<RazorpayCtor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  loading ??= new Promise<RazorpayCtor>((resolve, reject) => {
    const s = document.createElement("script")
    s.src = SCRIPT; s.async = true
    s.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay did not load")))
    s.onerror = () => { loading = null; reject(new Error("Razorpay did not load")) }
    document.head.appendChild(s)
  })
  return loading
}

export type RazorpayPrefill = { name: string; email: string; contact: string }

/** Opens the Razorpay popup for an order we already created, and renders nothing itself. */
export function RazorpayPopup({ keyId, orderId, amountPaise, prefill, testMode, onSuccess, onFailure, onDismiss }: {
  keyId: string; orderId: string; amountPaise: number; prefill: RazorpayPrefill; testMode: boolean
  onSuccess: (r: GatewaySuccess) => void; onFailure: (message: string) => void; onDismiss: (lastError?: string) => void
}) {
  // The latest callbacks without reopening the popup whenever the parent re-renders.
  const cb = useRef({ onSuccess, onFailure, onDismiss })
  useEffect(() => { cb.current = { onSuccess, onFailure, onDismiss } })

  useEffect(() => {
    let live = true
    let rzp: RazorpayInstance | null = null
    let lastError: string | undefined
    loadRazorpay().then((Razorpay) => {
      if (!live) return
      rzp = new Razorpay({
        key: keyId, order_id: orderId, amount: amountPaise, currency: "INR", name: "ShopKart",
        description: testMode ? "Test mode: no real money is charged" : "Your ShopKart order",
        prefill: { name: prefill.name, email: prefill.email, contact: prefill.contact }, theme: { color: "#c8102e" },
        handler: (r: GatewaySuccess) => cb.current.onSuccess(r),
        modal: { escape: true, ondismiss: () => cb.current.onDismiss(lastError) },
      })
      // A declined attempt: the popup lets the shopper try another method, so just remember what went wrong.
      rzp.on("payment.failed", (r) => { lastError = r.error?.description })
      rzp.open()
    }).catch(() => { if (live) cb.current.onFailure("We couldn't load the payment window. Check your connection and try again.") })
    return () => { live = false; rzp?.close() }
    // Open once per mount: the parent mounts this only while the "paying" step is showing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
