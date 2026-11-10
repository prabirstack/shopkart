"use client"
import { useState } from "react"
import { Gift } from "lucide-react"
import { DemoForm } from "@/components/info/demo-form"
import { formatMoney } from "@/lib/money"

const amounts = [50000, 100000, 200000, 500000]

export function GiftCardForm() {
  const [amount, setAmount] = useState(100000)
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section aria-labelledby="gc-details" className="grid gap-5 rounded-xl border bg-card p-5">
        <h2 id="gc-details" className="font-semibold">Choose an amount</h2>
        <div role="radiogroup" aria-label="Gift card amount" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {amounts.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={amount === a} onClick={() => setAmount(a)}
              className={`h-12 rounded-lg border text-sm font-semibold focus-visible:ring-[3px] focus-visible:ring-ring/50 ${amount === a ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"}`}>
              {formatMoney(a, undefined, undefined, { hideZeroDecimals: true })}
            </button>
          ))}
        </div>
        <DemoForm submitLabel={`Buy gift card for ${formatMoney(amount, undefined, undefined, { hideZeroDecimals: true })}`} notice="Gift cards aren't on sale yet, so nothing was purchased."
          fields={[
            { name: "to", label: "Recipient's name", required: true, half: true },
            { name: "toEmail", label: "Recipient's email", type: "email", required: true, half: true },
            { name: "from", label: "Your name", required: true, half: true, autoComplete: "name" },
            { name: "message", label: "Message (optional)", type: "textarea" },
          ]} />
      </section>
      <aside aria-label="Gift card preview" className="grid gap-3">
        <div className="grid aspect-[16/10] content-between rounded-2xl bg-gradient-to-br from-neutral-950 via-red-950 to-primary p-6 text-white shadow-lg">
          <p className="flex items-center gap-2 font-bold"><Gift className="size-5" aria-hidden="true" /> ShopKart</p>
          <div><p className="text-xs text-white/70">Gift card</p><p className="price text-3xl font-extrabold">{formatMoney(amount, undefined, undefined, { hideZeroDecimals: true })}</p></div>
        </div>
        <p className="text-xs text-muted-foreground">Delivered by email. Valid for 12 months. Not refundable or exchangeable for cash.</p>
      </aside>
    </div>
  )
}
