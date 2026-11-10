import Link from "next/link"
import { Eye, Star } from "lucide-react"
import { Price } from "@/components/price"
import { CompareToggle } from "@/features/compare/compare-toggle"
import { WishlistButton } from "@/features/wishlist/wishlist-button"
import { AddToCartButton } from "@/features/cart/add-to-cart-button"
import { discountPercent, type Product } from "@/features/catalog/types"
import { productPhotos } from "@/features/catalog/images"
import { ProductArt } from "./product-art"

const SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"

/**
 * Hover behaviour (also on keyboard focus): the card lifts and its border tints, the photo
 * zooms (or swaps to the second photo when there is one), a "Quick view" pill slides up and
 * the title takes the brand colour.
 */
export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product)
  const second = productPhotos(product.slug, product.images)[1]?.url
  const badge = off > 0 ? `-${off}%` : product.badge
  return (
    <article className="group/card relative flex h-full flex-col rounded-2xl border bg-card p-3 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-within:border-primary/30 focus-within:shadow-xl">
      {badge && (
        <span className="absolute left-3 top-3 z-10 origin-top-left rounded-md bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground transition-transform duration-300 group-hover/card:scale-110">
          {badge}
        </span>
      )}
      <div className="absolute right-3 top-3 z-10 grid gap-1.5 transition-transform duration-300"><WishlistButton productId={product.id} title={product.title} product={product} /><CompareToggle productId={product.id} title={product.title} /></div>
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col gap-2 rounded-lg focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <div className={`relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-neutral-50 to-neutral-200/80 ${product.stock === 0 ? "opacity-50" : ""}`}>
          <div className={`absolute inset-0 transition-all duration-500 ease-out group-hover/card:scale-110 ${second ? "group-hover/card:opacity-0" : ""}`}>
            <ProductArt slug={product.slug} title={product.title} category={product.category} images={product.images} sizes={SIZES} />
          </div>
          {second && (
            <div className="absolute inset-0 scale-105 opacity-0 transition-all duration-500 ease-out group-hover/card:scale-110 group-hover/card:opacity-100">
              <ProductArt slug={product.slug} title="" category={product.category} sizes={SIZES} src={second} />
            </div>
          )}
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-3 items-center justify-center gap-1.5 rounded-full bg-background/95 py-1.5 text-xs font-semibold opacity-0 shadow-md backdrop-blur transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100">
            <Eye className="size-3.5" /> Quick view
          </span>
        </div>
        <p className="text-xs font-medium text-muted-foreground">{product.brand}</p>
        <h3 className="product-title -mt-1 line-clamp-2 min-h-[2.8em] transition-colors duration-200 group-hover/card:text-primary">{product.title}</h3>
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
        <AddToCartButton productId={product.id} product={product} disabled={product.stock === 0} label={`Add ${product.title} to cart`} iconOnly className="size-8 shrink-0 p-0 transition-transform duration-200 hover:scale-110 active:scale-95" />
      </div>
    </article>
  )
}
