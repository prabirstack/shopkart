import { sql } from "drizzle-orm"
import { boolean, check, index, integer, jsonb, pgTable, primaryKey, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { id, timestamps } from "./common"
import { articleCategory, articleProductKind, articleStatus, bannerSlot, reviewStatus } from "./enums"
import { products } from "./catalog"
import { users } from "./identity"

/** TipTap/ProseMirror document stored as JSON. Rendered by an allowlist renderer, never as raw HTML. */
export type ArticleDoc = { type: string; attrs?: Record<string, unknown>; content?: ArticleDoc[]; marks?: { type: string; attrs?: Record<string, unknown> }[]; text?: string }

export const articles = pgTable("articles", {
  id: id(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  category: articleCategory("category").notNull(),
  authorName: text("author_name").notNull().default("Team ShopKart"),
  status: articleStatus("status").notNull().default("draft"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  doc: jsonb("doc").$type<ArticleDoc>().notNull(),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  ...timestamps,
}, (t) => [
  uniqueIndex("articles_slug_idx").on(t.slug),
  index("articles_listing_idx").on(t.status, t.publishedAt),
  check("articles_published_has_date", sql`${t.status} = 'draft' or ${t.publishedAt} is not null`),
])

/** Products an article features, or compares. */
export const articleProducts = pgTable("article_products", {
  articleId: uuid("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  kind: articleProductKind("kind").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.articleId, t.productId, t.kind] }), index("article_products_product_idx").on(t.productId)])

export const reviews = pgTable("reviews", {
  id: id(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  /** Null for imported or anonymous sample reviews. */
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name").notNull(),
  rating: smallint("rating").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  status: reviewStatus("status").notNull().default("pending"),
  verifiedPurchase: boolean("verified_purchase").notNull().default(false),
  helpfulCount: integer("helpful_count").notNull().default(0),
  ...timestamps,
}, (t) => [
  index("reviews_product_idx").on(t.productId, t.status, t.createdAt),
  index("reviews_moderation_idx").on(t.status, t.createdAt),
  // One review per customer per product (anonymous rows are exempt).
  uniqueIndex("reviews_one_per_user_idx").on(t.productId, t.userId).where(sql`${t.userId} is not null`),
  check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  check("reviews_text_lengths", sql`char_length(${t.title}) between 3 and 80 and char_length(${t.body}) between 20 and 1500`),
])

export const wishlistItems = pgTable("wishlist_items", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.productId] })])

export const banners = pgTable("banners", {
  id: id(),
  title: text("title").notNull(),
  slot: bannerSlot("slot").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  href: text("href").notNull(),
  isPaused: boolean("is_paused").notNull().default(false),
  ...timestamps,
}, (t) => [index("banners_active_idx").on(t.slot, t.startsAt, t.endsAt), check("banners_dates_ordered", sql`${t.endsAt} >= ${t.startsAt}`), check("banners_href_internal", sql`${t.href} like '/%'`)])
