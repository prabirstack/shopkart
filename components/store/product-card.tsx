import Link from "next/link"
import { Star } from "lucide-react"
import { Price } from "@/components/price"
import { WishlistButton } from "@/features/wishlist/wishlist-button"
import { AddToCartButton } from "@/features/cart/add-to-cart-button"
import { discountPercent, type Product } from "@/features/catalog/demo"

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product)
  const Icon = product.icon
  return (
    <article className="relative flex h-full flex-col rounded-xl border bg-card p-3 transition-shadow hover:shadow-md">
      {off > 0 && (
        <span className="absolute left-3 top-3 z-10 rounded-md bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
          -{off}%
        </span>
      )}
      {product.badge && (
        <span className="absolute left-3 top-3 z-10 rounded-md bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">
          {product.badge}
        </span>
      )}
      <div className="absolute right-3 top-3 z-10"><WishlistButton productId={product.id} title={product.title} /></div>
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col gap-2 rounded-lg focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <div className={`grid aspect-square place-items-center rounded-lg ${product.tint} ${product.stock === 0 ? "opacity-50" : ""}`}>
          <Icon className="size-1/3 text-neutral-700" strokeWidth={1.25} aria-hidden="true" />
        </div>
        <p className="text-xs font-medium text-muted-foreground">{product.brand}</p>
        <h3 className="product-title -mt-1 line-clamp-2 min-h-[2.8em]">{product.title}</h3>
        {product.rating && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-medium text-foreground">{product.rating}</span>
            <span>({product.reviews})</span>
          </p>
        )}
        {product.stock === 0 ? <p className="text-xs font-semibold text-destructive">Out of stock</p>
          : product.stock <= 10 ? <p className="text-xs font-medium text-amber-700">Only {product.stock} left</p> : null}
      </Link>
      <div className="mt-2 flex items-end justify-between gap-2">
        <Price cents={product.pricePaise} compareAtCents={product.comparePaise}
          showDiscountLabel={false} priceClassName="text-primary"
          className="[&_del]:text-xs" />
        <AddToCartButton productId={product.id} disabled={product.stock === 0} label={`Add ${product.title} to cart`} iconOnly className="size-8 shrink-0 p-0" />
      </div>
    </article>
  )
}
