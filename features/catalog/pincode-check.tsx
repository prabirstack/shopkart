"use client"
import { useState } from "react"
import { MapPin, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"

/** Demo estimate based on the first PIN digit. A real check asks the courier for serviceability. */
export function PincodeCheck() {
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)
  return (
    <form noValidate onSubmit={(e) => {
      e.preventDefault()
      const pin = String(new FormData(e.currentTarget).get("pin")).trim()
      if (!/^[1-9]\d{5}$/.test(pin)) { setResult({ ok: false, text: "Enter a valid 6-digit PIN code." }); return }
      const days = pin.startsWith("5") ? 3 : pin.startsWith("1") || pin.startsWith("4") || pin.startsWith("6") ? 4 : 5
      const date = new Date(); date.setDate(date.getDate() + days)
      setResult({ ok: true, text: `Delivery by ${new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" }).format(date)}` })
    }} className="grid gap-2 rounded-xl border bg-card p-4">
      <label htmlFor="pin" className="flex items-center gap-2 text-sm font-semibold"><MapPin className="size-4 text-primary" aria-hidden="true" /> Check delivery</label>
      <div className="flex gap-2">
        <input id="pin" name="pin" inputMode="numeric" maxLength={6} placeholder="Enter PIN code" autoComplete="postal-code" aria-describedby="pin-result"
          className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" />
        <Button type="submit" variant="outline" className="h-10 px-5">Check</Button>
      </div>
      <p id="pin-result" role="status" className={result ? `flex items-center gap-2 text-sm ${result.ok ? "font-medium text-emerald-700" : "text-destructive"}` : "sr-only"}>
        {result?.ok && <Truck className="size-4" aria-hidden="true" />}{result?.text}
      </p>
    </form>
  )
}
