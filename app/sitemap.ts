import type { MetadataRoute } from "next"
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
    page("/cookies", 0.2, "monthly"),
    ...categories.map((c) => page(`/products?category=${c.slug}`, 0.8, "weekly")),
    ...catalog.map((p) => page(`/products/${p.slug}`, 0.8, "weekly")),
  ]
}
