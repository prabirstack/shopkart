import Link from "next/link"
import { Heart, ShoppingCart, Star } from "lucide-react"
import { Price } from "@/components/price"
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
      {off > 0 && (
        <button type="button" aria-label={`Save ${product.title} to wishlist`}
          className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-full text-muted-foreground hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <Heart className="size-5" aria-hidden="true" />
        </button>
      )}
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col gap-2 rounded-lg focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <div className={`grid aspect-square place-items-center rounded-lg ${product.tint}`}>
          <Icon className="size-1/3 text-neutral-700" strokeWidth={1.25} aria-hidden="true" />
        </div>
        <h3 className="product-title line-clamp-2 min-h-[2.8em]">{product.title}</h3>
        {product.rating && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            <span className="font-medium text-foreground">{product.rating}</span>
            <span>({product.reviews})</span>
          </p>
        )}
      </Link>
      <div className="mt-2 flex items-end justify-between gap-2">
        <Price cents={product.pricePaise} compareAtCents={product.comparePaise}
          showDiscountLabel={false} priceClassName="text-primary"
          className="[&_del]:text-xs" />
        <button type="button" aria-label={`Add ${product.title} to cart`}
          className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <ShoppingCart className="size-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
