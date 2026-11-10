import { BenefitsStrip } from "./benefits-strip"
import { BrandsSection } from "./brands-section"
import { CategoryRail } from "./category-rail"
import { CategoryTiles } from "./category-tiles"
import { CollectionsSection } from "./collections-section"
import { Countdown } from "./countdown"
import { HeroCarousel } from "./hero-carousel"
import { NewsletterForm } from "./newsletter-form"
import { ProductRow } from "./product-row"
import { PromotionGrid } from "./promotion-grid"
import { SectionHeader } from "./section-header"
import { ShopByCategory } from "./shop-by-category"
import { TrustStrip } from "./trust-strip"
import { Crown } from "lucide-react"
import { dealProducts, recentlyViewed, topSelling } from "@/features/catalog/demo"
import { DEALS_END_AT, heroSlides } from "@/features/promotions/demo"

export function StorefrontHome() {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-8 py-4">
      <h1 className="sr-only">ShopKart online store</h1>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <CategoryRail />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <HeroCarousel slides={heroSlides} />
          <TrustStrip />
        </div>
      </div>
      <CategoryTiles />
      <PromotionGrid />
      <section aria-labelledby="deals-heading">
        <SectionHeader id="deals-heading" title="Today's Deals" href="/deals" linkLabel="View All Deals">
          <Countdown endsAt={DEALS_END_AT} />
        </SectionHeader>
        <ProductRow products={dealProducts} label="Today's deals" />
      </section>
      <section aria-labelledby="top-heading">
        <SectionHeader id="top-heading" title={<><Crown className="size-6 text-amber-500" aria-hidden="true" /> Top Selling Products</>} href="/products?sort=top" linkLabel="View All" />
        <ProductRow products={topSelling} label="Top selling products" />
      </section>
      <CollectionsSection />
      <ShopByCategory />
      <BrandsSection />
      <BenefitsStrip />
      <section aria-labelledby="recent-heading">
        <SectionHeader id="recent-heading" title="Recently Viewed" />
        <ProductRow products={recentlyViewed} label="Recently viewed products" />
      </section>
      <NewsletterForm variant="band" />
    </main>
  )
}
