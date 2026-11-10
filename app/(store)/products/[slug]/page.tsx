import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BadgeCheck, Check, CreditCard, FileText, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { FaqAccordion } from "@/components/info/faq-accordion"
import { JsonLd } from "@/components/json-ld"
import { Price } from "@/components/price"
import { OffersBox } from "@/components/store/offers-box"
import { ProductAside, ProductPromoBanner } from "@/components/store/promo-banners"
import { ProductCard } from "@/components/store/product-card"
import { ReviewsSection } from "@/components/store/reviews-section"
import { ShareButtons } from "@/components/store/share-buttons"
import { Stars } from "@/components/store/stars"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ViewItemEvent } from "@/features/analytics/view-events"
import { PurchasePanel } from "@/features/cart/purchase-panel"
import { bySlug, catalog, discountPercent, productBySlug, topSelling, type Product } from "@/features/catalog/demo"
import { PincodeCheck } from "@/features/catalog/pincode-check"
import { ProductGallery } from "@/features/catalog/product-gallery"
import { faqsFor, highlightsFor, specGroups, warrantyFor } from "@/features/catalog/specs"
import { breadcrumbLd, productLd } from "@/features/seo/structured-data"
import { WishlistButton } from "@/features/wishlist/wishlist-button"
import { formatMoney } from "@/lib/money"
import { FREE_DELIVERY_ABOVE_PAISE, RETURN_WINDOW_DAYS } from "@/lib/store-config"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

export function generateStaticParams() {
  return catalog.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps<"/products/[slug]">): Promise<Metadata> {
  const product = productBySlug((await params).slug)
  if (!product) return { title: "Product not found" }
  const description = `${product.description} Buy ${product.brand} ${product.title} at ${rupees(product.pricePaise)} with free delivery above ${rupees(FREE_DELIVERY_ABOVE_PAISE)}.`
  return {
    title: product.title,
    description: description.length > 158 ? `${description.slice(0, 155)}...` : description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { type: "website", title: product.title, description: product.description, url: `/products/${product.slug}`, images: [{ url: `/og/product/${product.slug}`, width: 1200, height: 630, alt: product.title }] },
    twitter: { card: "summary_large_image", title: product.title, description: product.description, images: [`/og/product/${product.slug}`] },
  }
}

const sections = [["#details", "Product details"], ["#reviews", "Reviews"], ["#faq", "Questions"]]
const tabTrigger = "h-auto flex-none rounded-none border-0 px-5 py-3.5 text-[0.95rem] text-muted-foreground hover:text-foreground data-active:bg-transparent data-active:font-semibold data-active:text-primary data-active:shadow-none after:!bottom-0 after:h-[3px] after:rounded-full after:bg-primary"

function ProductDetail({ product }: { product: Product }) {
  const category = bySlug(product.category)
  const off = discountPercent(product)
  const saving = product.comparePaise ? product.comparePaise - product.pricePaise : 0
  // Same category first, then top sellers, so the row is never half empty.
  const sameCategory = catalog.filter((p) => p.category === product.category && p.id !== product.id)
  const related = [...sameCategory, ...topSelling.filter((p) => p.id !== product.id && !sameCategory.includes(p))].slice(0, 5)
  const faqs = faqsFor(product)
  const stockNote = product.stock === 0 ? { text: "Out of stock", cls: "text-destructive" }
    : product.stock <= 10 ? { text: `Only ${product.stock} left in stock`, cls: "text-amber-700" }
    : { text: "In stock", cls: "text-emerald-700" }
  const trust = [
    { icon: BadgeCheck, text: "Genuine product", sub: warrantyFor(product) },
    { icon: Truck, text: "Fast delivery", sub: `Free above ${rupees(FREE_DELIVERY_ABOVE_PAISE)}` },
    { icon: RotateCcw, text: `${RETURN_WINDOW_DAYS}-day returns`, sub: "Unused items" },
    { icon: FileText, text: "GST invoice", sub: "With every order" },
  ]
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }

  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-8 py-6">
      <JsonLd data={[productLd(product), faqLd, breadcrumbLd([{ name: "Home", path: "/" }, { name: "Shop", path: "/products" }, { name: category.name, path: `/products?category=${category.slug}` }, { name: product.title, path: `/products/${product.slug}` }])]} />
      <ViewItemEvent productId={product.id} />
      <StoreBreadcrumbs trail={[{ label: "Shop", href: "/products" }, { label: category.name, href: `/products?category=${category.slug}` }, { label: product.title }]} />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <ProductGallery productId={product.id} badge={off > 0 ? `-${off}%` : undefined} />
          <section aria-labelledby="highlights" className="rounded-xl border bg-card p-5">
            <h2 id="highlights" className="mb-3 font-semibold">Highlights</h2>
            <ul className="grid gap-2 text-sm">
              {highlightsFor(product).map((h) => (
                <li key={h} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />{h}</li>
              ))}
            </ul>
          </section>
          <OffersBox />
          <ShareButtons title={product.title} productId={product.id} />
        </div>
        <div className="grid min-w-0 content-start gap-5">
          <div>
            <p className="text-sm font-medium text-primary">{product.brand}</p>
            <h1 className="store-title mt-1 !text-3xl">{product.title}</h1>
            {product.rating && (
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">{product.rating} ★</span>
                <Stars value={product.rating} />
                <a href="#reviews" className="text-muted-foreground underline-offset-4 hover:underline">{product.reviews} ratings</a>
              </p>
            )}
          </div>
          <section aria-label="Buy" className="grid gap-4 rounded-2xl border bg-card p-5 shadow-sm">
            <div className="grid gap-1">
              <Price cents={product.pricePaise} compareAtCents={product.comparePaise} showDiscountLabel={false} priceClassName="text-3xl text-primary" className="items-baseline gap-x-3" />
              {saving > 0 && <p className="text-sm font-medium text-emerald-700">You save {rupees(saving)} ({off}%)</p>}
              <p className="text-xs text-muted-foreground">Inclusive of all taxes (GST {product.gstPercent}%)</p>
            </div>
            <p className={`flex items-center gap-2 text-sm font-medium ${stockNote.cls}`}><span aria-hidden="true" className="size-2 rounded-full bg-current" />{stockNote.text}</p>
            <PurchasePanel productId={product.id} stock={product.stock} />
            <WishlistButton productId={product.id} title={product.title} variant="full" />
          </section>
          <PincodeCheck />
          <ProductPromoBanner />
          <ul aria-label="Purchase assurances" className="grid gap-3 sm:grid-cols-2">
            {[[Truck, "Free delivery", `Above ${rupees(FREE_DELIVERY_ABOVE_PAISE)}`], [RotateCcw, "Easy returns", `${RETURN_WINDOW_DAYS} days`], [ShieldCheck, "Warranty", warrantyFor(product)], [CreditCard, "Secure payment", "UPI, cards, netbanking"]].map(([Icon, title, sub]) => {
              const I = Icon as typeof Truck
              return (
                <li key={title as string} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><I className="size-5" aria-hidden="true" /></span>
                  <span className="min-w-0"><span className="block text-sm font-semibold">{title as string}</span><span className="block truncate text-xs text-muted-foreground">{sub as string}</span></span>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <nav aria-label="Product sections" className="sticky top-0 z-20 -mx-4 flex gap-6 overflow-x-auto border-b bg-background/95 px-4 text-sm font-medium backdrop-blur">
        {sections.map(([href, label]) => (
          <a key={href} href={href} className="whitespace-nowrap border-b-2 border-transparent py-3 hover:border-primary hover:text-primary">{label}</a>
        ))}
      </nav>

      <ul aria-label="Why shop with us" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {trust.map(({ icon: Icon, text, sub }) => (
          <li key={text} className="flex items-center gap-3 rounded-xl border bg-card p-4">
            <Icon className="size-8 shrink-0 text-primary" strokeWidth={1.5} aria-hidden="true" />
            <span><span className="block text-sm font-semibold">{text}</span><span className="text-xs text-muted-foreground">{sub}</span></span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-10">
          <section id="details" aria-labelledby="details-heading" className="scroll-mt-16">
            <h2 id="details-heading" className="section-title mb-3">Product details</h2>
            <Tabs defaultValue="overview" className="gap-0">
              <TabsList variant="line" aria-label="Product information" className="h-auto w-full justify-start overflow-x-auto rounded-none border-b p-0">
                <TabsTrigger value="overview" className={tabTrigger}>Overview</TabsTrigger>
                <TabsTrigger value="specs" className={tabTrigger}>Specifications</TabsTrigger>
                <TabsTrigger value="warranty" className={tabTrigger}>Warranty &amp; returns</TabsTrigger>
                <TabsTrigger value="delivery" className={tabTrigger}>Delivery &amp; payment</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="grid gap-3 pt-5">
                <p className="article-copy text-muted-foreground">{product.description}</p>
                <ul className="grid gap-2 text-sm">
                  {highlightsFor(product).map((h) => <li key={h} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />{h}</li>)}
                </ul>
              </TabsContent>
              <TabsContent value="specs" className="grid gap-5 pt-5">
                {specGroups(product).map((g) => (
                  <div key={g.title}>
                    <h3 className="mb-2 text-sm font-semibold">{g.title}</h3>
                    <dl className="overflow-hidden rounded-xl border bg-card text-sm">
                      {g.rows.map(([k, v], i) => (
                        <div key={k} className={`grid grid-cols-[9rem_minmax(0,1fr)] gap-x-4 px-5 py-3 ${i % 2 === 0 ? "bg-muted/40" : ""}`}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>
                      ))}
                    </dl>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Sample specifications for the demo store.</p>
              </TabsContent>
              <TabsContent value="warranty" className="grid gap-3 pt-5 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Warranty:</strong> {warrantyFor(product)}. Keep your GST invoice as proof of purchase.</p>
                <p><strong className="text-foreground">Returns:</strong> return unused items in original packaging within {RETURN_WINDOW_DAYS} days of delivery from Account, Orders. Refunds go to your original payment method after inspection.</p>
                <p><a href="/help/returns" className="font-medium text-primary hover:underline">Read the full returns policy</a></p>
              </TabsContent>
              <TabsContent value="delivery" className="grid gap-3 pt-5 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Delivery:</strong> free above {rupees(FREE_DELIVERY_ABOVE_PAISE)}; a flat fee applies below that. Most orders arrive in 3 to 5 working days after packing.</p>
                <p><strong className="text-foreground">Payment:</strong> UPI, cards, netbanking and wallets through Razorpay. We never see or store your card or UPI details.</p>
                <p><a href="/help/shipping" className="font-medium text-primary hover:underline">Read delivery information</a></p>
              </TabsContent>
            </Tabs>
          </section>

          <ReviewsSection product={product} />

          <section id="faq" aria-labelledby="faq-heading" className="grid scroll-mt-16 gap-3">
            <h2 id="faq-heading" className="section-title">Questions about this product</h2>
            <FaqAccordion items={faqs} idPrefix="pdp" />
            <p className="text-sm text-muted-foreground">More questions? See the <a href="/help/faq" className="font-medium text-primary hover:underline">help centre</a> or <a href="/contact" className="font-medium text-primary hover:underline">contact us</a>.</p>
          </section>
        </div>
        <ProductAside />
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="section-title mb-3">You may also like</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {related.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}
    </main>
  )
}

// Allowed to block so unknown slugs return a real 404 (good for SEO) instead of a streamed 200.
export const instant = false

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const product = productBySlug((await params).slug)
  if (!product) notFound()
  return <ProductDetail product={product} />
}
