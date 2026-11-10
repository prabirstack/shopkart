"use client"
import Link from "next/link"
import { Heart, Minus, Plus, ShoppingCart, Trash2, Truck } from "lucide-react"
import { SummaryRows } from "@/components/store/order-summary"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { Price } from "@/components/price"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { CouponBox } from "@/features/cart/coupon-box"
import { MAX_QUANTITY, useCart } from "@/features/cart/store"
import { useCartSummary } from "@/features/cart/use-cart-summary"
import { useWishlist } from "@/features/wishlist/store"
import { formatMoney } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE } from "@/lib/store-config"

export default function CartPage() {
  const { hydrated, items, quote, coupon, couponCode, couponProblem, count } = useCartSummary()
  const setQuantity = useCart((s) => s.setQuantity)
  const remove = useCart((s) => s.remove)
  const toggleWish = useWishlist((s) => s.toggle)
  const toFree = Math.max(0, FREE_DELIVERY_ABOVE_PAISE - (quote.subtotalPaise - quote.discountPaise))

  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6">
      <StoreBreadcrumbs trail={[{ label: "Cart" }]} />
      <h1 className="store-title !text-3xl">Your cart{hydrated && count > 0 && <span className="ml-2 text-lg font-medium text-muted-foreground">({count} {count === 1 ? "item" : "items"})</span>}</h1>
      {!hydrated ? <Skeleton className="h-72 w-full rounded-xl" /> : items.length === 0 ? (
        <Empty className="rounded-xl border">
          <EmptyHeader>
            <EmptyMedia variant="icon"><ShoppingCart aria-hidden="true" /></EmptyMedia>
            <EmptyTitle>Your cart is empty</EmptyTitle>
            <EmptyDescription>Browse today&apos;s deals and add something you like.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent><Link href="/products" className={buttonVariants()}>Continue shopping</Link></EmptyContent>
        </Empty>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section aria-label="Cart items" className="grid min-w-0 gap-3">
            <p className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-sm">
              <Truck className="size-4 text-primary" aria-hidden="true" />
              {toFree === 0 ? "You've unlocked free delivery." : `Add ${formatMoney(toFree, undefined, undefined, { hideZeroDecimals: true })} more for free delivery.`}
            </p>
            <ul className="grid gap-3">
              {items.map(({ product, quantity }) => {
                const Icon = product.icon
                const atMax = quantity >= Math.min(MAX_QUANTITY, product.stock)
                return (
                  <li key={product.id} className="grid grid-cols-[5rem_minmax(0,1fr)] gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto]">
                    <Link href={`/products/${product.slug}`} className="grid aspect-square place-items-center rounded-lg bg-neutral-100">
                      <Icon className="size-1/2 text-neutral-700" strokeWidth={1.25} aria-hidden="true" />
                      <span className="sr-only">{product.title}</span>
                    </Link>
                    <div className="grid min-w-0 content-start gap-1">
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                      <Link href={`/products/${product.slug}`} className="product-title line-clamp-2 hover:text-primary">{product.title}</Link>
                      <p className="text-xs text-muted-foreground">GST {product.gstPercent}% included</p>
                      {product.stock <= 10 && <p className="text-xs font-medium text-amber-700">Only {product.stock} left</p>}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <div role="group" aria-label={`Quantity for ${product.title}`} className="flex items-center rounded-lg border">
                          <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity(product.id, quantity - 1)} className="grid size-8 place-items-center"><Minus className="size-3.5" aria-hidden="true" /></button>
                          <span aria-live="polite" className="price w-7 text-center text-sm font-medium">{quantity}</span>
                          <button type="button" aria-label="Increase quantity" disabled={atMax} onClick={() => setQuantity(product.id, quantity + 1)} className="grid size-8 place-items-center disabled:opacity-40"><Plus className="size-3.5" aria-hidden="true" /></button>
                        </div>
                        <button type="button" onClick={() => remove(product.id)} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" aria-hidden="true" /> Remove</button>
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
          <aside aria-label="Order summary" className="grid gap-4 rounded-xl border bg-card p-5 lg:sticky lg:top-4">
            <h2 className="font-semibold">Order summary</h2>
            <CouponBox subtotalPaise={quote.subtotalPaise} appliedCode={couponCode} appliedOk={coupon !== null} />
            <SummaryRows q={quote} couponCode={coupon?.code} />
            {couponProblem && couponCode && <p className="sr-only">{couponProblem}</p>}
            <Link href="/checkout" className={buttonVariants({ size: "lg" }) + " h-11 w-full"}>Proceed to checkout</Link>
            <Link href="/products" className="text-center text-sm font-medium text-primary hover:underline">Continue shopping</Link>
          </aside>
        </div>
      )}
    </main>
  )
}
