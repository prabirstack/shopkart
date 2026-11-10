import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Check, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { Price } from "@/components/price"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { ReviewsSection } from "@/components/store/reviews-section"
import { ShareButtons } from "@/components/store/share-buttons"
import { Stars } from "@/components/store/stars"
import { ProductCard } from "@/components/store/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import { PurchasePanel } from "@/features/cart/purchase-panel"
import { ProductGallery } from "@/features/catalog/product-gallery"
import { WishlistButton } from "@/features/wishlist/wishlist-button"
import { bySlug, catalog, discountPercent, productBySlug } from "@/features/catalog/demo"
import { formatMoney } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE, RETURN_WINDOW_DAYS } from "@/lib/store-config"

export function generateStaticParams() {
  return catalog.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = productBySlug((await params).slug)
  return { title: product ? `${product.title} | ShopKart` : "Product not found" }
}

async function ProductDetail({ params }: { params: PageProps<"/products/[slug]">["params"] }) {
  const product = productBySlug((await params).slug)
  if (!product) notFound()
  const category = bySlug(product.category)
  const off = discountPercent(product)
  const related = catalog.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)
  const stockNote = product.stock === 0 ? { text: "Out of stock", cls: "text-destructive" }
    : product.stock <= 10 ? { text: `Only ${product.stock} left in stock`, cls: "text-amber-700" }
    : { text: "In stock", cls: "text-emerald-700" }

  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-8 py-6">
      <StoreBreadcrumbs trail={[{ label: "Shop", href: "/products" }, { label: category.name, href: `/products?category=${category.slug}` }, { label: product.title }]} />
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery productId={product.id} badge={off > 0 ? `-${off}%` : undefined} />
        <div className="grid content-start gap-5">
          <div>
            <p className="text-sm font-medium text-primary">{product.brand}</p>
            <h1 className="store-title mt-1 !text-3xl">{product.title}</h1>
            {product.rating && (
              <p className="mt-2 flex items-center gap-2 text-sm">
                <Stars value={product.rating} />
                <span className="font-semibold">{product.rating}</span>
                <a href="#reviews" className="text-muted-foreground underline-offset-4 hover:underline">({product.reviews} ratings)</a>
              </p>
            )}
          </div>
          <div>
            <Price cents={product.pricePaise} compareAtCents={product.comparePaise} priceClassName="text-3xl text-primary" className="items-baseline gap-x-3" />
            <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes (GST {product.gstPercent}%)</p>
          </div>
          <p className={`text-sm font-medium ${stockNote.cls}`}>{stockNote.text}</p>
          <PurchasePanel productId={product.id} stock={product.stock} />
          <WishlistButton productId={product.id} title={product.title} variant="full" />
          <ul className="grid gap-3 rounded-xl border p-4 text-sm">
            <li className="flex items-center gap-3"><Truck className="size-5 text-primary" aria-hidden="true" /> Free delivery on orders above {formatMoney(FREE_DELIVERY_ABOVE_PAISE, undefined, undefined, { hideZeroDecimals: true })}</li>
            <li className="flex items-center gap-3"><RotateCcw className="size-5 text-primary" aria-hidden="true" /> {RETURN_WINDOW_DAYS}-day easy returns</li>
            <li className="flex items-center gap-3"><ShieldCheck className="size-5 text-primary" aria-hidden="true" /> Secure, encrypted checkout</li>
          </ul>
        </div>
      </div>
      <ShareButtons title={product.title} />
      <nav aria-label="Product sections" className="sticky top-0 z-20 -mx-4 flex gap-6 overflow-x-auto border-b bg-background/95 px-4 text-sm font-medium backdrop-blur">
        {[["#overview", "Overview"], ["#specs", "Specifications"], ["#reviews", "Reviews"]].map(([href, label]) => (
          <a key={href} href={href} className="whitespace-nowrap border-b-2 border-transparent py-3 hover:border-primary hover:text-primary">{label}</a>
        ))}
      </nav>
      <section id="overview" aria-labelledby="about" className="grid max-w-3xl scroll-mt-24 gap-3">
        <h2 id="about" className="section-title">About this product</h2>
        <p className="article-copy text-muted-foreground">{product.description}</p>
        <ul className="mt-1 grid gap-2 text-sm">
          {["Genuine product with brand warranty", `Inclusive of GST (${product.gstPercent}%), tax invoice with every order`, `${RETURN_WINDOW_DAYS}-day easy returns`].map((h) => (
            <li key={h} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />{h}</li>
          ))}
        </ul>
      </section>
      <section id="specs" aria-labelledby="specs-heading" className="grid max-w-3xl scroll-mt-24 gap-3">
        <h2 id="specs-heading" className="section-title">Specifications</h2>
        <dl className="grid grid-cols-[9rem_1fr] gap-y-3 rounded-xl border bg-card p-5 text-sm">
          <dt className="text-muted-foreground">Brand</dt><dd>{product.brand}</dd>
          <dt className="text-muted-foreground">Category</dt><dd>{category.name}</dd>
          <dt className="text-muted-foreground">SKU</dt><dd className="font-mono text-xs">{product.id.toUpperCase()}-{product.slug.slice(0, 6).toUpperCase()}</dd>
          <dt className="text-muted-foreground">GST rate</dt><dd>{product.gstPercent}%</dd>
          <dt className="text-muted-foreground">Returns</dt><dd>{RETURN_WINDOW_DAYS} days from delivery</dd>
        </dl>
      </section>
      <ReviewsSection product={product} />
      {related.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="section-title mb-3">More in {category.name}</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}
    </main>
  )
}

export default function ProductPage({ params }: PageProps<"/products/[slug]">) {
  return (
    <Suspense fallback={<main className="store-container py-6"><Skeleton className="h-[40rem] w-full rounded-2xl" /></main>}>
      <ProductDetail params={params} />
    </Suspense>
  )
}
