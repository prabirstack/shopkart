// Add the three reference products without reseeding or changing existing inventory.
// Run: node scripts/add-category-products.mjs
import { readFile, access } from "node:fs/promises"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import dotenv from "dotenv"
import pg from "pg"
import sharp from "sharp"

const root = fileURLToPath(new URL("../", import.meta.url))
dotenv.config({ path: resolve(root, ".env"), quiet: true })
dotenv.config({ path: resolve(root, ".env.local"), override: true, quiet: true })
const entries = JSON.parse(await readFile(new URL("./data/category-products.json", import.meta.url), "utf8"))
const manifest = JSON.parse(await readFile(resolve(root, "features/catalog/image-manifest.json"), "utf8"))
// Validate every asset before starting a transaction; no product is created without photos.
const images = new Map()
for (const entry of entries) {
  const urls = manifest.products[entry.slug]
  if (!urls?.length) throw new Error(`Missing images for ${entry.slug}`)
  images.set(entry.slug, await Promise.all(urls.map(async (url) => {
    const file = resolve(root, `public${url}`)
    await access(file)
    const { width, height } = await sharp(file).metadata()
    return { url, width, height }
  })))
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
try {
  await client.connect()
  await client.query("BEGIN")
  await client.query("SELECT pg_advisory_xact_lock(hashtext('shopkart-reference-category-products'))")
  for (const entry of entries) {
    const exists = await client.query("SELECT id FROM products WHERE slug=$1", [entry.slug])
    if (exists.rowCount) { console.log(`Already exists: ${entry.slug}`); continue }
    const category = (await client.query("SELECT id FROM categories WHERE slug=$1", [entry.category])).rows[0]
    const tax = (await client.query("SELECT id FROM tax_categories WHERE rate_percent=$1 ORDER BY name LIMIT 1", [entry.gstPercent])).rows[0]
    if (!category || !tax) throw new Error(`Missing category or tax reference: ${entry.slug}`)
    const brandSlug = entry.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    await client.query("INSERT INTO brands(name,slug) VALUES($1,$2) ON CONFLICT DO NOTHING", [entry.brand, brandSlug])
    const brand = (await client.query("SELECT id FROM brands WHERE lower(name)=lower($1) OR slug=$2 LIMIT 1", [entry.brand, brandSlug])).rows[0]
    const product = (await client.query(`INSERT INTO products(category_id,brand_id,tax_category_id,title,slug,sku,description,price_paise,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,'published') RETURNING id`,
    [category.id, brand.id, tax.id, entry.title, entry.slug, entry.sku, entry.description, entry.pricePaise])).rows[0]
    await client.query("INSERT INTO stock_levels(product_id,on_hand,reserved) VALUES($1,0,0)", [product.id])
    for (const [position, photo] of images.get(entry.slug).entries()) {
      await client.query("INSERT INTO product_images(product_id,url,alt,position,width,height) VALUES($1,$2,$3,$4,$5,$6)",
        [product.id, photo.url, entry.title, position, photo.width, photo.height])
    }
    await client.query("INSERT INTO audit_events(action,entity,entity_id,after) VALUES('product.create','product',$1,$2::jsonb)",
      [product.id, JSON.stringify({ sku: entry.sku, title: entry.title, referenceUrl: entry.referenceUrl, priceReferenceUrl: entry.priceReferenceUrl, referencePriceCheckedAt: "2026-11-11", initialStock: 0 })])
    console.log(`Added ${entry.slug}: published, out of stock`)
  }
  await client.query("COMMIT")
} catch (error) {
  await client.query("ROLLBACK").catch(() => {})
  throw error
} finally {
  await client.end()
}
