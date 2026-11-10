"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { CreditCard, Info, Lock, ShoppingCart } from "lucide-react"
import { Price } from "@/components/price"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { SummaryRows } from "@/components/store/order-summary"
import { Button, buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { MockRazorpayCheckout, type GatewaySuccess } from "@/features/payments/mock-razorpay-dialog"
import { useCart } from "@/features/cart/store"
import { CouponBox } from "@/features/cart/coupon-box"
import { useCartSummary } from "@/features/cart/use-cart-summary"
import { formatMoney } from "@/lib/money"
import { INDIAN_STATES, checkoutSchema, type CheckoutValues } from "@/features/checkout/schema"

const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function CheckoutPage() {
  const { hydrated, items, quote, coupon, couponCode } = useCartSummary()
  const router = useRouter()
  const clear = useCart((st) => st.clear)
  const [phase, setPhase] = useState<"idle" | "creating" | "paying" | "verifying">("idle")
  const [error, setError] = useState("")
  const [pending, setPending] = useState<{ orderId: string; amountPaise: number; orderToken: string } | null>(null)

  const startPayment = async (values: CheckoutValues) => {
    setError(""); setPhase("creating")
    try {
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((l) => ({ id: l.product.id, quantity: l.quantity })), coupon: coupon?.code ?? null, customer: values }) })
      const data = await res.json()
      if (!res.ok) { setError(data?.error?.message ?? "We couldn't start your payment."); setPhase("idle"); return }
      setPending(data); setPhase("paying")
    } catch { setError("Couldn't reach the server. Check your connection and try again."); setPhase("idle") }
  }

  const finishPayment = async (gateway: GatewaySuccess) => {
    if (!pending) return
    setPhase("verifying")
    try {
      const res = await fetch("/api/checkout/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderToken: pending.orderToken, ...gateway }) })
      const data = await res.json()
      if (!res.ok) { setError(data?.error?.message ?? "We couldn't confirm your payment."); setPending(null); setPhase("idle"); return }
      clear(); router.push("/checkout/success")
    } catch { setError("Payment may have gone through but we couldn't confirm it. Don't pay again; contact support."); setPending(null); setPhase("idle") }
  }
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutValues>({ resolver: zodResolver(checkoutSchema), defaultValues: { state: undefined } })
  const a = (id: keyof CheckoutValues, hint?: boolean) => ({
    id, "aria-invalid": errors[id] ? true : undefined,
    "aria-describedby": errors[id] ? `${id}-error` : hint ? `${id}-hint` : undefined,
  })

  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6">
      <StoreBreadcrumbs trail={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="store-title !text-3xl">Checkout</h1>
      {!hydrated ? <Skeleton className="h-96 w-full rounded-xl" /> : items.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><ShoppingCart aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Nothing to check out</EmptyTitle>
            <EmptyDescription>Add a few products to your cart first.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Link href="/products" className={buttonVariants()}>Browse products</Link></EmptyContent>
        </Empty>
      ) : (
        <form noValidate onSubmit={handleSubmit(startPayment)} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid min-w-0 gap-6">
            <p role="note" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>Demo checkout with a dummy Razorpay window: no real money moves and no account is needed yet. Checkout will require a verified account (<Link href="/login" className="font-medium underline">sign in</Link>) once identity is built.</span>
            </p>
            <fieldset className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
              <legend className="px-2 text-base font-semibold">1. Contact</legend>
              <Field id="fullName" label="Full name" error={errors.fullName?.message}><input {...register("fullName")} {...a("fullName")} autoComplete="name" className={input} /></Field>
              <Field id="phone" label="Mobile number" error={errors.phone?.message} hint="10 digits, without +91"><input {...register("phone")} {...a("phone", true)} inputMode="numeric" autoComplete="tel-national" maxLength={10} className={input} /></Field>
              <div className="sm:col-span-2"><Field id="email" label="Email" error={errors.email?.message} hint="We send your order confirmation and GST invoice here."><input {...register("email")} {...a("email", true)} type="email" autoComplete="email" className={input} /></Field></div>
            </fieldset>
            <fieldset className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2">
              <legend className="px-2 text-base font-semibold">2. Delivery address</legend>
              <div className="sm:col-span-2"><Field id="line1" label="Address line 1" error={errors.line1?.message}><input {...register("line1")} {...a("line1")} autoComplete="address-line1" className={input} /></Field></div>
              <div className="sm:col-span-2"><Field id="line2" label="Address line 2 (optional)" error={errors.line2?.message}><input {...register("line2")} {...a("line2")} autoComplete="address-line2" className={input} /></Field></div>
              <Field id="city" label="City" error={errors.city?.message}><input {...register("city")} {...a("city")} autoComplete="address-level2" className={input} /></Field>
              <Field id="pincode" label="PIN code" error={errors.pincode?.message}><input {...register("pincode")} {...a("pincode")} inputMode="numeric" autoComplete="postal-code" maxLength={6} className={input} /></Field>
              <div className="sm:col-span-2"><Field id="state" label="State" error={errors.state?.message}>
                <select {...register("state")} {...a("state")} autoComplete="address-level1" className={input} defaultValue="">
                  <option value="" disabled>Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field></div>
            </fieldset>
            <fieldset className="grid gap-3 rounded-xl border bg-card p-5">
              <legend className="px-2 text-base font-semibold">3. Payment</legend>
              <label className="flex items-start gap-3 rounded-lg border border-primary bg-primary/5 p-4 text-sm">
                <input type="radio" name="payment" defaultChecked className="mt-1 accent-primary" />
                <span><span className="flex items-center gap-2 font-medium"><CreditCard className="size-4" aria-hidden="true" /> Razorpay</span><span className="text-muted-foreground">UPI, cards, netbanking and wallets. You&apos;ll pay on Razorpay&apos;s secure page.</span></span>
              </label>
            </fieldset>
          </div>
          <aside aria-label="Order summary" className="grid gap-4 rounded-xl border bg-card p-5 lg:sticky lg:top-4">
            <h2 className="font-semibold">Order summary</h2>
            <ul className="grid max-h-56 gap-3 overflow-y-auto">
              {items.map(({ product, quantity }) => {
                const Icon = product.icon
                return (
                  <li key={product.id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                    <span className="grid size-12 place-items-center rounded-lg bg-neutral-100"><Icon className="size-6 text-neutral-700" strokeWidth={1.25} aria-hidden="true" /></span>
                    <span className="min-w-0"><span className="line-clamp-1 font-medium">{product.title}</span><span className="text-xs text-muted-foreground">Qty {quantity}</span></span>
                    <Price cents={product.pricePaise * quantity} priceClassName="text-sm" />
                  </li>
                )
              })}
            </ul>
            <CouponBox subtotalPaise={quote.subtotalPaise} appliedCode={couponCode} appliedOk={coupon !== null} />
            <SummaryRows q={quote} couponCode={coupon?.code} />
            <div className="grid gap-1.5">
              <label className="flex items-start gap-2 text-sm"><input type="checkbox" {...register("terms")} aria-invalid={errors.terms ? true : undefined} aria-describedby={errors.terms ? "terms-error" : undefined} className="mt-0.5 accent-primary" />
                <span>I agree to the <Link href="/" className="underline">Terms &amp; Conditions</Link> and <Link href="/" className="underline">Return policy</Link>.</span></label>
              {errors.terms && <p id="terms-error" role="alert" className="text-xs text-destructive">{errors.terms.message}</p>}
            </div>
            <Button type="submit" size="lg" className="h-11 w-full" disabled={phase !== "idle"}><Lock aria-hidden="true" /> {phase === "creating" ? "Preparing payment…" : phase === "verifying" ? "Confirming payment…" : `Pay ${formatMoney(quote.totalPaise, undefined, undefined, { hideZeroDecimals: true })}`}</Button>
            {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          </aside>
        </form>
      )}
      {pending && phase === "paying" && (
        <MockRazorpayCheckout orderId={pending.orderId} amountPaise={pending.amountPaise} onSuccess={finishPayment}
          onFailure={(m) => { setError(m + " Your cart is unchanged."); setPending(null); setPhase("idle") }}
          onDismiss={() => { setError("Payment was cancelled. Your cart is unchanged."); setPending(null); setPhase("idle") }} />
      )}
    </main>
  )
}
