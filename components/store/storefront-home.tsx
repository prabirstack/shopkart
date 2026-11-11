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
import { MobileShoppingBanner } from "./mobile-shopping-banner"
import { TestimonialsSection } from "./testimonials-section"
import { TrustStrip } from "./trust-strip"
import { Crown } from "lucide-react"
import { getDeals, getTopSelling, getNewArrivals, getBestsellers, getShopResults } from "@/features/catalog/data"
import { parseShopParams } from "@/features/catalog/query"
import { RecentlyViewedRow } from "@/features/catalog/recently-viewed"
import { DEALS_END_AT, heroSlides } from "@/features/promotions/demo"
import { getHeroBanners } from "@/features/promotions/data"

export async function StorefrontHome() {
  const [dealProducts, topSelling, guides, heroBanners, arrivals, favorites, budget] = await Promise.all([
    getDeals(10), getTopSelling(5), getPublishedArticles(), getHeroBanners(),
    getNewArrivals(10), getBestsellers(10), getShopResults(parseShopParams({ max: "1999", sort: "popular" }), 10),
  ])
  return (
    <main className="store-home store-container grid grid-cols-[minmax(0,1fr)] gap-5 py-3">
      <h1 className="sr-only">ShopKart online store</h1>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <CategoryRail />
        <div className="grid min-w-0 content-start grid-cols-[minmax(0,1fr)] gap-2">
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
        <ProductRow compact products={dealProducts} label="Today's deals" alwaysShowArrows />
      </section>
      <section aria-labelledby="top-heading">
        <SectionHeader id="top-heading" title={<><Crown className="size-6 text-amber-500" aria-hidden="true" /> Top Selling Products</>} href="/top-selling" linkLabel="View All" />
        <ProductRow compact products={topSelling} label="Top selling products" />
      </section>
      <CollectionsSection />
      {arrivals.length > 0 && <section aria-labelledby="arrivals-heading">
        <SectionHeader id="arrivals-heading" title="New Arrivals" href="/new-arrivals" linkLabel="Explore New Arrivals" />
        <ProductRow compact products={arrivals} label="New arrivals" alwaysShowArrows />
      </section>}
      {favorites.length > 0 && <section aria-labelledby="favorites-heading" >
        <SectionHeader id="favorites-heading" title="Customer Favorites" href="/bestsellers" linkLabel="View Bestsellers" />
        <ProductRow compact products={favorites} label="Customer favorites" alwaysShowArrows />
      </section>}
      {budget.items.length > 0 && <section aria-labelledby="budget-heading">
        <SectionHeader id="budget-heading" title="Great Finds Under ₹2,000" href="/products?max=1999&sort=popular" linkLabel="Shop All" />
        <ProductRow compact products={budget.items} label="Products under 2000 rupees" alwaysShowArrows />
      </section>}
      <ShopByCategory />
      <BrandsSection />
      <BenefitsStrip />
      <MobileShoppingBanner />
      <RecentlyViewedRow compact />
      <LatestGuides initial={guides} />
      <TestimonialsSection />
      <NewsletterForm variant="band" />
    </main>
  )
}
