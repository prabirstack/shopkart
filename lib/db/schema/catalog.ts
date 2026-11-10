import { sql } from "drizzle-orm"
import { check, index, integer, pgTable, smallint, text, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { id, tsvector, timestamps } from "./common"
import { productStatus } from "./enums"

export const brands = pgTable("brands", {
  id: id(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  ...timestamps,
}, (t) => [uniqueIndex("brands_slug_idx").on(t.slug), uniqueIndex("brands_name_idx").on(sql`lower(${t.name})`)])

export const categories = pgTable("categories", {
  id: id(),
  name: text("name").notNull(),
  /** Short label used on tiles, e.g. "Mobiles" for "Mobiles & Tablets". */
  shortName: text("short_name").notNull(),
  slug: text("slug").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  ...timestamps,
}, (t) => [uniqueIndex("categories_slug_idx").on(t.slug)])

/** GST rates a product can use. A product points at one, so a rate change is one row, not a product-by-product edit. */
export const taxCategories = pgTable("tax_categories", {
  id: id(),
  name: text("name").notNull(),
  hsn: text("hsn"),
  ratePercent: smallint("rate_percent").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("tax_categories_name_idx").on(t.name),
  check("tax_rate_allowed", sql`${t.ratePercent} in (0, 5, 12, 18, 28)`),
])

export const products = pgTable("products", {
  id: id(),
  categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  brandId: uuid("brand_id").notNull().references(() => brands.id, { onDelete: "restrict" }),
  taxCategoryId: uuid("tax_category_id").notNull().references(() => taxCategories.id, { onDelete: "restrict" }),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  sku: text("sku").notNull(),
  description: text("description").notNull().default(""),
  /** Selling price, GST included, in paise. */
  pricePaise: integer("price_paise").notNull(),
  /** Original price shown struck through. Must be higher than the selling price. */
  comparePaise: integer("compare_paise"),
  badge: text("badge"),
  status: productStatus("status").notNull().default("draft"),
  /**
   * Denormalised review totals so lists can show a rating without scanning every review.
   * Kept in step by the review moderation functions (see queries/reviews.ts).
   */
  ratingCount: integer("rating_count").notNull().default(0),
  ratingSum: integer("rating_sum").notNull().default(0),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  searchVector: tsvector("search_vector").generatedAlwaysAs(sql`to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(sku, ''))`),
  ...timestamps,
}, (t) => [
  uniqueIndex("products_slug_idx").on(t.slug),
  uniqueIndex("products_sku_idx").on(t.sku),
  index("products_category_idx").on(t.categoryId, t.status),
  index("products_brand_idx").on(t.brandId),
  index("products_search_idx").using("gin", t.searchVector),
  check("products_price_positive", sql`${t.pricePaise} > 0`),
  check("products_compare_above_price", sql`${t.comparePaise} is null or ${t.comparePaise} > ${t.pricePaise}`),
  check("products_rating_totals", sql`${t.ratingCount} >= 0 and ${t.ratingSum} >= 0 and ${t.ratingSum} <= ${t.ratingCount} * 5`),
])

export const productImages = pgTable("product_images", {
  id: id(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  /** An uploaded photo (/media/products/<uuid>.webp) or a demo file in public/images/products. */
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  /** 0 is the main image (the one on cards). Saving a product rewrites the whole set, so positions stay 0..n-1. */
  position: integer("position").notNull().default(0),
  /** Pixel size of the stored file; null for demo files that were never measured. */
  width: integer("width"),
  height: integer("height"),
  ...timestamps,
}, (t) => [
  uniqueIndex("product_images_position_idx").on(t.productId, t.position),
  check("product_images_alt_len", sql`char_length(${t.alt}) <= 160`),
  check("product_images_position", sql`${t.position} >= 0`),
  check("product_images_url", sql`${t.url} like '/media/products/%' or ${t.url} like '/images/products/%'`),
])
