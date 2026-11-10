"use client"
import { useState } from "react"
import { Check, Tag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { couponProblem, findCoupon } from "@/features/coupons/demo"
import { useCart } from "./store"

export function CouponBox({ subtotalPaise, appliedCode, appliedOk }: { subtotalPaise: number; appliedCode: string | null; appliedOk: boolean }) {
  const setCoupon = useCart((s) => s.setCoupon)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  if (appliedCode && appliedOk) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        <span className="flex items-center gap-2"><Check className="size-4" aria-hidden="true" /> <strong>{appliedCode}</strong> applied</span>
        <button type="button" onClick={() => setCoupon(null)} className="inline-flex items-center gap-1 text-xs font-medium underline-offset-4 hover:underline"><X className="size-3" aria-hidden="true" /> Remove</button>
      </div>
    )
  }
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      const problem = couponProblem(findCoupon(code), subtotalPaise)
      if (problem) { setError(problem); return }
      setError(""); setCoupon(code.trim().toUpperCase()); setCode("")
    }} className="grid gap-1.5">
      <label htmlFor="coupon" className="flex items-center gap-1.5 text-sm font-medium"><Tag className="size-4" aria-hidden="true" /> Have a coupon?</label>
      <div className="flex gap-2">
        <input id="coupon" value={code} onChange={(e) => { setCode(e.target.value); setError("") }} placeholder="Enter code" autoCapitalize="characters"
          aria-invalid={error ? true : undefined} aria-describedby={error ? "coupon-error" : undefined}
          className="h-9 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm uppercase outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" />
        <Button type="submit" variant="outline" disabled={code.trim() === ""}>Apply</Button>
      </div>
      {(error || (appliedCode && !appliedOk)) && <p id="coupon-error" role="alert" className="text-xs text-destructive">{error || `${appliedCode} no longer applies to this cart.`}</p>}
      <p className="text-xs text-muted-foreground">Try WELCOME10 or FLAT200.</p>
    </form>
  )
}
