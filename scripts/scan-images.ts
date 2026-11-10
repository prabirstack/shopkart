/**
 * Scans public/images and writes features/catalog/image-manifest.json, so every
 * component (server or client) knows which photos exist. Run after adding images:
 *
 *   pnpm images
 *
 * Naming (see docs/images.md):
 *   public/images/products/<slug>.webp          main image
 *   public/images/products/<slug>-2.webp ...    extra gallery views (-2 to -6)
 *   public/images/categories/<slug>.webp        category tile
 *   public/images/campaigns/<slide-id>.webp     hero slide artwork
 */
import { readdirSync, writeFileSync, existsSync } from "node:fs"
import { join, extname, basename } from "node:path"
import { catalog, categories } from "./data/catalog"
import { heroSlides } from "../features/promotions/demo"

const ROOT = join(process.cwd(), "public", "images")
const OK = new Set([".webp", ".avif", ".jpg", ".jpeg", ".png"])

const list = (dir: string) => (existsSync(join(ROOT, dir)) ? readdirSync(join(ROOT, dir)).filter((f) => OK.has(extname(f).toLowerCase())).sort() : [])
const stem = (f: string) => basename(f, extname(f))

const products: Record<string, string[]> = {}
for (const f of list("products")) {
  const m = stem(f).match(/^(.*?)(?:-([2-6]))?$/)!
  const slug = m[1]
  ;(products[slug] ??= []).push(`/images/products/${f}`)
}
for (const slug of Object.keys(products)) products[slug].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

const categoriesMap: Record<string, string> = {}
for (const f of list("categories")) categoriesMap[stem(f)] = `/images/categories/${f}`
const campaigns: Record<string, string> = {}
for (const f of list("campaigns")) campaigns[stem(f)] = `/images/campaigns/${f}`

const manifest = { products, categories: categoriesMap, campaigns }
writeFileSync(join(process.cwd(), "features", "catalog", "image-manifest.json"), JSON.stringify(manifest, null, 2) + "\n")

const missingProducts = catalog.filter((p) => !products[p.slug]).map((p) => p.slug)
const missingCategories = categories.filter((c) => !categoriesMap[c.slug]).map((c) => c.slug)
const missingCampaigns = heroSlides.filter((s) => !campaigns[s.id]).map((s) => s.id)
const unknown = Object.keys(products).filter((s) => !catalog.some((p) => p.slug === s))

console.log(`Products   ${catalog.length - missingProducts.length}/${catalog.length} have images`)
console.log(`Categories ${categories.length - missingCategories.length}/${categories.length} have images`)
console.log(`Campaigns  ${heroSlides.length - missingCampaigns.length}/${heroSlides.length} have images`)
if (missingProducts.length) console.log(`\nMissing product images (public/images/products/<slug>.webp):\n  ${missingProducts.join("\n  ")}`)
if (missingCategories.length) console.log(`\nMissing category images (public/images/categories/<slug>.webp):\n  ${missingCategories.join("\n  ")}`)
if (missingCampaigns.length) console.log(`\nMissing hero images (public/images/campaigns/<id>.webp):\n  ${missingCampaigns.join("\n  ")}`)
if (unknown.length) console.log(`\nWarning: image files that match no product slug: ${unknown.join(", ")}`)
