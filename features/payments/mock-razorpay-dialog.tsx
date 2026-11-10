"use client"
import { useEffect, useRef, useState } from "react"
import { Banknote, CreditCard, Landmark, ShieldCheck, Smartphone, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMoney } from "@/lib/money"

export type GatewaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }

const methods = [
  { id: "upi", label: "UPI", note: "Pay with any UPI app", icon: Smartphone },
  { id: "card", label: "Card", note: "Test card 4111 1111 1111 1111", icon: CreditCard },
  { id: "netbanking", label: "Netbanking", note: "All major banks", icon: Landmark },
  { id: "wallet", label: "Wallet", note: "Popular wallets", icon: Banknote },
]

/** Look-alike of Razorpay Standard Checkout for local testing. It never sees real payment details. */
export function MockRazorpayCheckout({ orderId, amountPaise, onSuccess, onFailure, onDismiss }: {
  orderId: string; amountPaise: number
  onSuccess: (r: GatewaySuccess) => void; onFailure: (message: string) => void; onDismiss: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [method, setMethod] = useState("upi")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  const pay = async (outcome: "success" | "failure") => {
    setBusy(true)
    try {
      const res = await fetch("/api/payments/mock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, outcome }) })
      const data = await res.json()
      if (res.ok) onSuccess(data as GatewaySuccess)
      else onFailure(data?.error?.description ?? "Payment failed.")
    } catch { onFailure("Couldn't reach the payment service. Please try again.") }
  }

  return (
    <dialog ref={ref} onCancel={(e) => { e.preventDefault(); if (!busy) onDismiss() }} aria-labelledby="rzp-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border bg-background p-0 shadow-2xl backdrop:bg-black/50">
      <div className="rounded-t-2xl bg-slate-900 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="rzp-title" className="font-semibold">ShopKart</h2>
            <p className="text-xs text-white/70">Razorpay checkout · TEST MODE (dummy)</p>
          </div>
          <button type="button" aria-label="Close payment window" disabled={busy} onClick={onDismiss} className="rounded-full p-1 hover:bg-white/10"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <p className="price mt-4 text-3xl font-bold">{formatMoney(amountPaise)}</p>
        <p className="font-mono text-xs text-white/60">{orderId}</p>
      </div>
      <div className="grid gap-4 p-5">
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-semibold">Choose a payment method</legend>
          {methods.map(({ id, label, note, icon: Icon }) => (
            <label key={id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${method === id ? "border-primary bg-primary/5" : ""}`}>
              <input type="radio" name="method" value={id} checked={method === id} onChange={() => setMethod(id)} className="accent-primary" />
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1"><span className="block font-medium">{label}</span><span className="text-xs text-muted-foreground">{note}</span></span>
            </label>
          ))}
        </fieldset>
        <Button type="button" size="lg" className="h-11" disabled={busy} onClick={() => pay("success")}>{busy ? "Processing…" : `Pay ${formatMoney(amountPaise)}`}</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => pay("failure")}>Simulate failed payment</Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><ShieldCheck className="size-3.5" aria-hidden="true" /> Dummy gateway: no real money moves.</p>
      </div>
    </dialog>
  )
}
