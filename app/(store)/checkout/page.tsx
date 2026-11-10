"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ChevronDown, CreditCard, Info, Lock, LogIn, ShoppingCart, TriangleAlert } from "lucide-react"
import { Price } from "@/components/price"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { CheckoutSteps } from "@/components/store/checkout-steps"
import { ProductArt } from "@/components/store/product-art"
import { SummaryRows } from "@/components/store/order-summary"
import { Button } from "@/components/ui/button"
import { StoreEmptyState } from "@/components/store/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { MockRazorpayCheckout, type GatewaySuccess } from "@/features/payments/mock-razorpay-dialog"
import { RazorpayPopup } from "@/features/payments/razorpay-checkout"
import { useCart } from "@/features/cart/store"
import { trackAddPaymentInfo, trackBeginCheckout } from "@/features/analytics/events"
import { CouponBox } from "@/features/cart/coupon-box"
import { useCartSummary } from "@/features/cart/use-cart-summary"
import { forgetProducts } from "@/features/catalog/use-products"
import { cancelOrder, checkoutErrorMessage, loadOrder, loadPrefill, placeOrder, verifyPayment, type PlacedOrder, loadPaymentConfig, type PaymentConfig } from "@/features/checkout/api"
import { INDIAN_STATES, checkoutSchema, type CheckoutValues } from "@/features/checkout/schema"
import { authClient } from "@/lib/auth-client"
import { formatMoney } from "@/lib/money"

const input = "h-11 w-full rounded-xl border bg-background px-3.5 text-sm shadow-xs outline-none transition hover:border-primary/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 aria-invalid:border-destructive"

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// One idempotency key per checkout attempt, kept in sessionStorage until the order is paid or cancelled. Sending it
// again (a double click, a retry after a dropped connection) returns the same order instead of creating a second one.
// The key is tied to what was ordered: change the cart, coupon or address and the next attempt is a new order.
const ATTEMPT = "shopkart-checkout-attempt"
type Attempt = { key: string; fingerprint: string; number?: string }
const readAttempt = (): Attempt | null => { try { const v = JSON.parse(sessionStorage.getItem(ATTEMPT) ?? "null"); return v && typeof v.key === "string" ? v : null } catch { return null } }
const writeAttempt = (a: Attempt | null) => { try { if (a) sessionStorage.setItem(ATTEMPT, JSON.stringify(a)); else sessionStorage.removeItem(ATTEMPT) } catch { /* storage blocked: no retry protection, still works */ } }

type Phase = "idle" | "creating" | "paying" | "verifying" | "unpaid"

export default function CheckoutPage() {
  const { loading, buyable, soldOut, quote, coupon, couponCode, couponProblem, checking, notices } = useCartSummary()
  const session = authClient.useSession()
  const router = useRouter()
  const clear = useCart((st) => st.clear)
  const [phase, setPhase] = useState<Phase>("idle")
  const [payConfig, setPayConfig] = useState<PaymentConfig | null>(null)
  useEffect(() => { void loadPaymentConfig().then((r) => { if (r.ok) setPayConfig(r.data) }) }, [])
  const [error, setError] = useState("")
  const [order, setOrder] = useState<PlacedOrder | null>(null)
  const signedIn = Boolean(session.data?.user)
  const userId = session.data?.user.id

  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm<CheckoutValues>({ resolver: zodResolver(checkoutSchema), defaultValues: { state: undefined } })
  const a = (id: keyof CheckoutValues, hint?: boolean) => ({
    id, "aria-invalid": errors[id] ? true : undefined,
    "aria-describedby": errors[id] ? `${id}-error` : hint ? `${id}-hint` : undefined,
  })

  // Prefill from the account: name, email, phone and the default address. Runs once per sign-in.
  useEffect(() => {
    if (!userId) return
    let live = true
    void loadPrefill().then((p) => {
      if (!live || !p) return
      const ad = p.address
      reset({
        fullName: p.name, email: p.email, phone: p.phone ?? ad?.phone ?? "",
        ...(ad ? { line1: ad.line1, line2: ad.line2 ?? "", city: ad.city, pincode: ad.pincode, ...((INDIAN_STATES as readonly string[]).includes(ad.state) ? { state: ad.state as CheckoutValues["state"] } : {}) } : {}),
      })
    })
    return () => { live = false }
  }, [userId, reset])

  const began = useRef(false)
  useEffect(() => {
    if (signedIn && !loading && buyable.length > 0 && !began.current) { began.current = true; trackBeginCheckout(buyable, quote.totalPaise, coupon?.code ?? null) }
  }, [signedIn, loading, buyable, quote.totalPaise, coupon])

  const fail = useCallback((message: string, then: Phase = "idle") => { setError(message); setPhase(then) }, [])

  const startPayment = async (values: CheckoutValues) => {
    if (soldOut > 0 || buyable.length === 0) return
    setError(""); setPhase("creating")
    const items = buyable.map((l) => ({ productId: l.product.id, quantity: l.quantity }))
    const body = {
      items, couponCode: coupon?.code ?? null,
      customer: { name: values.fullName, email: values.email, phone: values.phone },
      shipTo: { name: values.fullName, phone: values.phone, line1: values.line1, ...(values.line2 ? { line2: values.line2 } : {}), city: values.city, state: values.state, pincode: values.pincode },
    }
    const fingerprint = JSON.stringify([items.map((i) => `${i.productId}:${i.quantity}`).sort(), body.couponCode, body.customer, body.shipTo])
    let attempt = readAttempt()
    if (!attempt || attempt.fingerprint !== fingerprint) {
      if (attempt?.number) void cancelOrder(attempt.number) // an earlier unpaid order for a different cart: release its stock
      attempt = { key: crypto.randomUUID(), fingerprint }
      writeAttempt(attempt)
    }
    const res = await placeOrder(body, attempt.key)
    if (!res.ok) {
      if (["OUT_OF_STOCK", "INSUFFICIENT_STOCK", "PRODUCT_UNAVAILABLE", "QUANTITY_LIMIT"].includes(res.code)) forgetProducts()
      return fail(checkoutErrorMessage(res))
    }
    const placed = res.data
    if (placed.status === "paid") { writeAttempt(null); clear(); return router.push(`/checkout/success?order=${placed.number}`) }
    if (placed.status !== "pending") { writeAttempt(null); return fail(`Order ${placed.number} is ${placed.status}. Please check My orders, or place a new order.`) }
    writeAttempt({ ...attempt, number: placed.number })
    trackAddPaymentInfo(buyable, quote.totalPaise, "razorpay")
    setOrder(placed)
    if (placed.mode === "none") return fail("Online payments are not set up on this site yet, so this order can't be paid. Cancel it and try again later.", "unpaid")
    setPhase("paying")
  }

  const finishPayment = async (gateway: GatewaySuccess) => {
    if (!order) return
    setPhase("verifying")
    const res = await verifyPayment(gateway)
    if (!res.ok) {
      return fail(res.code === "NETWORK" ? "Payment may have gone through but we couldn't confirm it. Don't pay again: check My orders or contact support." : checkoutErrorMessage(res), "unpaid")
    }
    writeAttempt(null); clear(); router.push(`/checkout/success?order=${order.number}`)
  }

  const retryPayment = async () => {
    if (!order) return
    setError(""); setPhase("creating")
    const res = await loadOrder(order.number)
    if (!res.ok) return fail(checkoutErrorMessage(res), "unpaid")
    if (res.data.status === "paid") { writeAttempt(null); clear(); return router.push(`/checkout/success?order=${order.number}`) }
    if (res.data.status !== "pending") { writeAttempt(null); setOrder(null); return fail(`Order ${order.number} is ${res.data.status} and can't be paid any more.`) }
    setOrder(res.data)
    if (res.data.mode === "none") return fail("Online payments are not set up on this site yet, so this order can't be paid. Cancel it and try again later.", "unpaid")
    setPhase("paying")
  }

  const cancel = async () => {
    if (!order) return
    setError(""); setPhase("creating")
    const res = await cancelOrder(order.number)
    if (!res.ok) return fail(res.code === "CONFLICT" || res.status === 409 ? `${res.message} Check My orders.` : checkoutErrorMessage(res), "unpaid")
    writeAttempt(null); setOrder(null); forgetProducts()
    fail("Your order was cancelled and nothing was charged. Your cart is unchanged.")
  }

  const busy = phase === "creating" || phase === "verifying"
  const waiting = loading || session.isPending

  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6">
      <StoreBreadcrumbs trail={[{ label: "Cart", href: "/cart" }, { label: "Checkout" }]} />
      <CheckoutSteps current={1} />
      <h1 className="store-title !text-3xl">Checkout</h1>
      {waiting ? <Skeleton className="h-96 w-full rounded-xl" /> : buyable.length === 0 && soldOut === 0 && !order ? (
        <StoreEmptyState icon={ShoppingCart} title="Nothing to check out" text="Add a few products to your cart and come back here to pay securely." primary={{ href: "/products", label: "Browse products" }} secondary={{ href: "/cart", label: "View cart" }} />
      ) : !signedIn ? (
        <StoreEmptyState icon={LogIn} suggest={false} title="Sign in to check out" text="We need an account to keep your order, delivery address and GST invoice together. Your cart is saved and waiting."
          primary={{ href: "/login?next=%2Fcheckout", label: "Sign in" }} secondary={{ href: "/register?next=%2Fcheckout", label: "Create an account" }} />
      ) : (
        <form noValidate onSubmit={handleSubmit(startPayment)} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="grid min-w-0 gap-6">
            {payConfig && !(payConfig.mode === "razorpay" && !payConfig.testMode) && (
              <p role="note" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {payConfig.mode === "mock" && "Demo checkout with a dummy payment window: no real money moves. Your order is saved to your account."}
                  {payConfig.mode === "razorpay" && "Razorpay test mode: use Razorpay's test card, UPI or netbanking details in the payment window. No real money moves."}
                  {payConfig.mode === "none" && "Online payments aren't set up on this site yet, so orders can't be placed."}
                </span>
              </p>
            )}
            {notices.length > 0 && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{notices.join(" ")}</p>}
            {soldOut > 0 && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">Something in your cart is out of stock. <Link href="/cart" className="font-medium underline">Update your cart</Link> to continue.</p>}
            <fieldset disabled={order !== null} className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs sm:grid-cols-2 sm:p-6">
              <legend className="flex items-center gap-2.5 px-2 text-base font-semibold"><span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>Contact</legend>
              <Field id="fullName" label="Full name" error={errors.fullName?.message}><input {...register("fullName")} {...a("fullName")} autoComplete="name" className={input} /></Field>
              <Field id="phone" label="Mobile number" error={errors.phone?.message} hint="10 digits, without +91"><input {...register("phone")} {...a("phone", true)} inputMode="numeric" autoComplete="tel-national" maxLength={10} className={input} /></Field>
              <div className="sm:col-span-2"><Field id="email" label="Email" error={errors.email?.message} hint="We send your order confirmation and GST invoice here."><input {...register("email")} {...a("email", true)} type="email" autoComplete="email" className={input} /></Field></div>
            </fieldset>
            <fieldset disabled={order !== null} className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs sm:grid-cols-2 sm:p-6">
              <legend className="flex items-center gap-2.5 px-2 text-base font-semibold"><span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>Delivery address</legend>
              <div className="sm:col-span-2"><Field id="line1" label="Address line 1" error={errors.line1?.message}><input {...register("line1")} {...a("line1")} autoComplete="address-line1" className={input} /></Field></div>
              <div className="sm:col-span-2"><Field id="line2" label="Address line 2 (optional)" error={errors.line2?.message}><input {...register("line2")} {...a("line2")} autoComplete="address-line2" className={input} /></Field></div>
              <Field id="city" label="City" error={errors.city?.message}><input {...register("city")} {...a("city")} autoComplete="address-level2" className={input} /></Field>
              <Field id="pincode" label="PIN code" error={errors.pincode?.message}><input {...register("pincode")} {...a("pincode")} inputMode="numeric" autoComplete="postal-code" maxLength={6} className={input} /></Field>
              <div className="sm:col-span-2"><Field id="state" label="State" error={errors.state?.message}>
                <div className="relative"><select {...register("state")} {...a("state")} autoComplete="address-level1" className={`${input} cursor-pointer appearance-none pr-10`} defaultValue="">
                  <option value="" disabled>Select state</option>
                  {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div>
              </Field></div>
            </fieldset>
            <fieldset className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
              <legend className="flex items-center gap-2.5 px-2 text-base font-semibold"><span aria-hidden="true" className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>Payment</legend>
              <label className="flex items-start gap-3 rounded-xl border-2 border-primary bg-primary/5 p-4 text-sm shadow-xs">
                <input type="radio" name="payment" defaultChecked className="mt-1 accent-primary" />
                <span><span className="flex items-center gap-2 font-medium"><CreditCard className="size-4" aria-hidden="true" /> Razorpay</span><span className="text-muted-foreground">UPI, cards, netbanking and wallets. You&apos;ll pay on Razorpay&apos;s secure page.</span></span>
              </label>
            </fieldset>
          </div>
          <aside aria-label="Order summary" className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm lg:sticky lg:top-4">
            <h2 className="font-semibold">Order summary</h2>
            <ul className="grid max-h-56 gap-3 overflow-y-auto">
              {buyable.map(({ product, quantity }) => (
                <li key={product.id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="relative grid size-12 place-items-center overflow-hidden rounded-lg bg-neutral-100"><ProductArt slug={product.slug} images={product.images} title="" category={product.category} sizes="48px" imageClassName="object-contain p-1" iconClassName="size-6 text-neutral-700" /></span>
                  <span className="min-w-0"><span className="line-clamp-1 font-medium">{product.title}</span><span className="text-xs text-muted-foreground">Qty {quantity}</span></span>
                  <Price cents={product.pricePaise * quantity} priceClassName="text-sm" />
                </li>
              ))}
            </ul>
            {order === null && <CouponBox items={buyable.map((l) => ({ productId: l.product.id, quantity: l.quantity }))} appliedCode={couponCode} appliedOk={coupon !== null} checking={checking} problem={couponProblem} />}
            <SummaryRows q={quote} couponCode={coupon?.code} />
            {order === null ? (
              <>
                <div className="grid gap-1.5">
                  <label className="flex items-start gap-2 text-sm"><input type="checkbox" {...register("terms")} aria-invalid={errors.terms ? true : undefined} aria-describedby={errors.terms ? "terms-error" : undefined} className="mt-0.5 accent-primary" />
                    <span>I agree to the <Link href="/terms" className="underline">Terms &amp; Conditions</Link> and <Link href="/help/returns" className="underline">Return policy</Link>.</span></label>
                  {errors.terms && <p id="terms-error" role="alert" className="text-xs text-destructive">{errors.terms.message}</p>}
                </div>
                <Button type="submit" size="lg" className="h-11 w-full" disabled={busy || soldOut > 0 || checking}><Lock aria-hidden="true" /> {phase === "creating" ? "Preparing payment…" : phase === "verifying" ? "Confirming payment…" : `Pay ${formatMoney(quote.totalPaise, undefined, undefined, { hideZeroDecimals: true })}`}</Button>
              </>
            ) : (
              <div className="grid gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-4" aria-hidden="true" /> {phase === "paying" || phase === "verifying" ? "Waiting for payment" : "Payment not completed"}</p>
                <p>Order <span className="font-mono font-medium">{order.number}</span> is saved and your items are held for you. Nothing has been charged.</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                  <Button type="button" size="lg" className="h-11" disabled={busy || phase === "paying"} onClick={() => void retryPayment()}><Lock aria-hidden="true" /> Try payment again</Button>
                  <Button type="button" variant="outline" className="h-11 bg-background" disabled={busy || phase === "paying"} onClick={() => void cancel()}>Cancel order</Button>
                </div>
              </div>
            )}
            {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          </aside>
        </form>
      )}
      {order && phase === "paying" && order.mode === "mock" && (
        <MockRazorpayCheckout orderId={order.providerOrderId} amountPaise={order.amountPaise} onSuccess={(g) => void finishPayment(g)}
          onFailure={(m) => fail(`${m} Nothing was charged.`, "unpaid")}
          onDismiss={() => fail("You closed the payment window before paying.", "unpaid")} />
      )}
      {order && phase === "paying" && order.mode === "razorpay" && order.keyId && (
        <RazorpayPopup keyId={order.keyId} orderId={order.providerOrderId} amountPaise={order.amountPaise} testMode={order.testMode}
          prefill={{ name: getValues("fullName") ?? "", email: getValues("email") ?? "", contact: getValues("phone") ?? "" }}
          onSuccess={(g) => void finishPayment(g)}
          onFailure={(m) => fail(`${m} Nothing was charged.`, "unpaid")}
          onDismiss={(last) => fail(last ? `${last} Nothing was charged.` : "You closed the payment window before paying.", "unpaid")} />
      )}
    </main>
  )
}
