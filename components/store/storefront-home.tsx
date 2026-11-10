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
import { LatestGuides } from "@/components/articles/article-list"
import { getPublishedArticles } from "@/features/articles/data"
import { TestimonialsSection } from "./testimonials-section"
import { TrustStrip } from "./trust-strip"
import { Crown } from "lucide-react"
import { getDeals, getTopSelling } from "@/features/catalog/data"
import { RecentlyViewedRow } from "@/features/catalog/recently-viewed"
import { DEALS_END_AT, heroSlides } from "@/features/promotions/demo"
import { getHeroBanners } from "@/features/promotions/data"

export async function StorefrontHome() {
  const [dealProducts, topSelling, guides, heroBanners] = await Promise.all([getDeals(10), getTopSelling(5), getPublishedArticles(), getHeroBanners()])
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-8 py-4">
      <h1 className="sr-only">ShopKart online store</h1>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <CategoryRail />
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
          <HeroCarousel slides={heroSlides} banners={heroBanners} />
          <TrustStrip />
        </div>
      </div>
      <CategoryTiles />
      <PromotionGrid />
      <section aria-labelledby="deals-heading">
        <SectionHeader id="deals-heading" title="Today's Deals" href="/deals" linkLabel="View All Deals">
          <Countdown endsAt={DEALS_END_AT} />
        </SectionHeader>
        <ProductRow products={dealProducts} label="Today's deals" alwaysShowArrows />
      </section>
      <section aria-labelledby="top-heading">
        <SectionHeader id="top-heading" title={<><Crown className="size-6 text-amber-500" aria-hidden="true" /> Top Selling Products</>} href="/top-selling" linkLabel="View All" />
        <ProductRow products={topSelling} label="Top selling products" />
      </section>
      <CollectionsSection />
      <ShopByCategory />
      <BrandsSection />
      <BenefitsStrip />
      <RecentlyViewedRow />
      <LatestGuides initial={guides} />
      <TestimonialsSection />
      <NewsletterForm variant="band" />
    </main>
  )
}
