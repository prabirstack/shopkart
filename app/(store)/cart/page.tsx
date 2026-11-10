"use client"
import Link from "next/link"
import { useEffect, useRef } from "react"
import { FileText, Heart, Lock, Minus, Plus, RotateCcw, ShoppingCart, Trash2, Truck } from "lucide-react"
import { CheckoutSteps } from "@/components/store/checkout-steps"
import { ProductArt } from "@/components/store/product-art"
import { SummaryRows } from "@/components/store/order-summary"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { Price } from "@/components/price"
import { buttonVariants } from "@/components/ui/button"
import { StoreEmptyState } from "@/components/store/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { trackRemoveFromCart, trackViewCart } from "@/features/analytics/events"
import { CouponBox } from "@/features/cart/coupon-box"
import { MAX_QUANTITY, useCart } from "@/features/cart/store"
import { useCartSummary } from "@/features/cart/use-cart-summary"
import { useWishlist } from "@/features/wishlist/store"
import { formatMoney } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE, RETURN_WINDOW_DAYS } from "@/lib/store-config"
import { ProductRow } from "@/components/store/product-row"
import { SectionHeader } from "@/components/store/section-header"
import { topSelling } from "@/features/catalog/demo"

export default function CartPage() {
  const { hydrated, items, quote, coupon, couponCode, couponProblem, count } = useCartSummary()
  const setQuantity = useCart((s) => s.setQuantity)
  const remove = useCart((s) => s.remove)
  const toggleWish = useWishlist((s) => s.toggle)
  const viewed = useRef(false)
  useEffect(() => {
    if (hydrated && items.length > 0 && !viewed.current) { viewed.current = true; trackViewCart(items, quote.subtotalPaise) }
  }, [hydrated, items, quote.subtotalPaise])
  const toFree = Math.max(0, FREE_DELIVERY_ABOVE_PAISE - (quote.subtotalPaise - quote.discountPaise))

  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6">
      <StoreBreadcrumbs trail={[{ label: "Cart" }]} />
      <CheckoutSteps current={0} />
      <h1 className="store-title !text-3xl">Your cart{hydrated && count > 0 && <span className="ml-2 text-lg font-medium text-muted-foreground">({count} {count === 1 ? "item" : "items"})</span>}</h1>
      {!hydrated ? <Skeleton className="h-72 w-full rounded-xl" /> : items.length === 0 ? (
        <StoreEmptyState icon={ShoppingCart} title="Your cart is empty" text="Looks like you haven't added anything yet. Browse today's deals and find something you love." primary={{ href: "/products", label: "Continue shopping" }} secondary={{ href: "/deals", label: "See today's deals" }} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section aria-label="Cart items" className="grid min-w-0 gap-3">
            <div className={`grid gap-2 rounded-2xl border p-4 text-sm ${toFree === 0 ? "border-emerald-200 bg-emerald-50" : "bg-card"}`}>
              <p className="flex items-center gap-2 font-medium"><Truck className={`size-4 ${toFree === 0 ? "text-emerald-700" : "text-primary"}`} aria-hidden="true" />
                {toFree === 0 ? "You've unlocked free delivery." : `Add ${formatMoney(toFree, undefined, undefined, { hideZeroDecimals: true })} more for free delivery.`}</p>
              <div role="progressbar" aria-label="Progress to free delivery" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(1, (quote.subtotalPaise - quote.discountPaise) / FREE_DELIVERY_ABOVE_PAISE) * 100)} className="h-2 overflow-hidden rounded-full bg-muted">
                <span className={`block h-full rounded-full transition-all ${toFree === 0 ? "bg-emerald-600" : "bg-primary"}`} style={{ width: `${Math.min(1, (quote.subtotalPaise - quote.discountPaise) / FREE_DELIVERY_ABOVE_PAISE) * 100}%` }} />
              </div>
            </div>
            <ul className="grid gap-3">
              {items.map(({ product, quantity }) => {
                const Icon = product.icon
                const atMax = quantity >= Math.min(MAX_QUANTITY, product.stock)
                return (
                  <li key={product.id} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-4 shadow-xs transition-shadow duration-300 hover:shadow-md sm:grid-cols-[6rem_minmax(0,1fr)_auto]">
                    <Link href={`/products/${product.slug}`} className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-200/80">
                      <ProductArt slug={product.slug} title={product.title} icon={Icon} sizes="96px" imageClassName="object-contain p-2" iconClassName="size-1/2 text-neutral-700" />
                    </Link>
                    <div className="grid min-w-0 content-start gap-1">
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                      <Link href={`/products/${product.slug}`} className="product-title line-clamp-2 hover:text-primary">{product.title}</Link>
                      <p className="text-xs text-muted-foreground">GST {product.gstPercent}% included</p>
                      {product.stock <= 10 && <p className="text-xs font-medium text-amber-700">Only {product.stock} left</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <div role="group" aria-label={`Quantity for ${product.title}`} className="flex items-center overflow-hidden rounded-xl border bg-background">
                          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(product.id, quantity - 1)} className="grid size-9 place-items-center transition-colors hover:bg-muted"><Minus className="size-3.5" aria-hidden="true" /></button>
                          <span aria-live="polite" className="price w-7 text-center text-sm font-medium">{quantity}</span>
                          <button type="button" aria-label="Increase quantity" disabled={atMax} onClick={() => setQuantity(product.id, quantity + 1)} className="grid size-9 place-items-center transition-colors hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"><Plus className="size-3.5" aria-hidden="true" /></button>
                        </div>
                        <button type="button" onClick={() => { trackRemoveFromCart(product, quantity); remove(product.id) }} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" aria-hidden="true" /> Remove</button>
                        <button type="button" onClick={() => { toggleWish(product.id); remove(product.id) }} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"><Heart className="size-3.5" aria-hidden="true" /> Save for later</button>
                      </div>
                      {atMax && <p className="text-xs text-muted-foreground">Maximum quantity reached.</p>}
                    </div>
                    <div className="col-span-2 flex items-baseline justify-between sm:col-span-1 sm:block sm:text-right">
                      <Price cents={product.pricePaise * quantity} priceClassName="text-lg" />
                      {quantity > 1 && <p className="price text-xs text-muted-foreground">{formatMoney(product.pricePaise, undefined, undefined, { hideZeroDecimals: true })} each</p>}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
          <aside aria-label="Order summary" className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm lg:sticky lg:top-4">
            <h2 className="font-semibold">Order summary</h2>
            <CouponBox subtotalPaise={quote.subtotalPaise} appliedCode={couponCode} appliedOk={coupon !== null} />
            <SummaryRows q={quote} couponCode={coupon?.code} />
            {couponProblem && couponCode && <p className="sr-only">{couponProblem}</p>}
            <Link href="/checkout" className={buttonVariants({ size: "lg" }) + " h-11 w-full"}>Proceed to checkout</Link>
            <Link href="/products" className="text-center text-sm font-medium text-primary hover:underline">Continue shopping</Link>
            <ul className="grid gap-2 border-t pt-4 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><Lock className="size-3.5" aria-hidden="true" /> Secure, encrypted checkout</li>
              <li className="flex items-center gap-2"><RotateCcw className="size-3.5" aria-hidden="true" /> {RETURN_WINDOW_DAYS}-day easy returns</li>
              <li className="flex items-center gap-2"><FileText className="size-3.5" aria-hidden="true" /> GST invoice with every order</li>
            </ul>
          </aside>
        </div>
      )}
      {hydrated && items.length > 0 && (
        <section aria-labelledby="cart-reco">
          <SectionHeader id="cart-reco" title="You may also like" href="/bestsellers" linkLabel="See bestsellers" />
          <ProductRow products={topSelling.filter((p) => !items.some((l) => l.product.id === p.id))} label="Recommended products" />
        </section>
      )}
    </main>
  )
}
