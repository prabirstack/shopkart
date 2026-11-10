import type { MetadataRoute } from "next"
import { publishedSeed } from "@/features/articles/seed"
import { catalog, categories } from "@/features/catalog/demo"
import { CONTENT_UPDATED, absoluteUrl } from "@/lib/site"

/** Only pages worth indexing: no cart, checkout, account, admin, login or filtered URLs. */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "daily" | "weekly" | "monthly") =>
    ({ url: absoluteUrl(path), lastModified: CONTENT_UPDATED, changeFrequency, priority })
  return [
    page("/", 1, "daily"),
    page("/products", 0.9, "daily"),
    page("/deals", 0.9, "daily"),
    page("/categories", 0.7, "weekly"),
    page("/brands", 0.6, "weekly"),
    page("/collections", 0.6, "weekly"),
    page("/new-arrivals", 0.7, "daily"),
    page("/bestsellers", 0.7, "daily"),
    page("/top-selling", 0.7, "daily"),
    page("/gift-cards", 0.5, "monthly"),
    page("/help", 0.5, "monthly"),
    page("/help/faq", 0.5, "monthly"),
    page("/help/returns", 0.5, "monthly"),
    page("/help/shipping", 0.5, "monthly"),
    page("/help/track-order", 0.4, "monthly"),
    page("/contact", 0.5, "monthly"),
    page("/about", 0.4, "monthly"),
    page("/careers", 0.3, "monthly"),
    page("/press", 0.2, "monthly"),
    page("/sustainability", 0.2, "monthly"),
    page("/sell", 0.3, "monthly"),
    page("/terms", 0.2, "monthly"),
    page("/privacy", 0.2, "monthly"),
    page("/news", 0.7, "weekly"),
    ...publishedSeed.map((a) => page(`/news/${a.slug}`, 0.6, "monthly")),
    page("/cookies", 0.2, "monthly"),
    ...categories.map((c) => page(`/products?category=${c.slug}`, 0.8, "weekly")),
    ...catalog.map((p) => page(`/products/${p.slug}`, 0.8, "weekly")),
  ]
}
