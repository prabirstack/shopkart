import { sql } from "drizzle-orm"
import { boolean, check, index, integer, jsonb, pgTable, primaryKey, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core"
import { id, timestamps } from "./common"
import { articleCategory, articleProductKind, articleStatus, bannerSlot, contactStatus, newsletterStatus, reviewStatus } from "./enums"
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

/** One "helpful" vote per customer per review. reviews.helpful_count is kept equal to the number of rows here. */
export const reviewVotes = pgTable("review_votes", {
  reviewId: uuid("review_id").notNull().references(() => reviews.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.reviewId, t.userId] }), index("review_votes_user_idx").on(t.userId)])

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
  /** Uploaded artwork (/media/banners/<uuid>.webp). A banner without an image is allowed. */
  imageUrl: text("image_url"),
  imageAlt: text("image_alt").notNull().default(""),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  ...timestamps,
}, (t) => [
  index("banners_active_idx").on(t.slot, t.startsAt, t.endsAt), check("banners_dates_ordered", sql`${t.endsAt} >= ${t.startsAt}`), check("banners_href_internal", sql`${t.href} like '/%'`),
  check("banners_image_alt_len", sql`char_length(${t.imageAlt}) <= 160`), check("banners_image_url", sql`${t.imageUrl} is null or ${t.imageUrl} like '/media/banners/%'`),
])

/** Messages sent from the contact form. Staff read and resolve them in the admin Inbox. */
export const contactMessages = pgTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  /** Optional order the message is about, like SK-10482. */
  orderNumber: text("order_number"),
  message: text("message").notNull(),
  status: contactStatus("status").notNull().default("new"),
  /** Set when the sender was signed in. */
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  handledBy: uuid("handled_by").references(() => users.id, { onDelete: "set null" }),
  handledAt: timestamp("handled_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [
  index("contact_messages_status_idx").on(t.status, t.createdAt),
  check("contact_messages_lengths", sql`char_length(${t.name}) between 2 and 80 and char_length(${t.message}) between 10 and 2000`),
])

/** People who asked for the newsletter. Unsubscribing keeps the row (so we never re-add someone who left) and is one click via the token. */
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: id(),
  email: text("email").notNull(),
  status: newsletterStatus("status").notNull().default("subscribed"),
  /** Random token in the unsubscribe link, so only the person with the email can unsubscribe. */
  unsubscribeToken: text("unsubscribe_token").notNull(),
  source: text("source").notNull().default("footer"),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  ...timestamps,
}, (t) => [uniqueIndex("newsletter_email_idx").on(sql`lower(${t.email})`), uniqueIndex("newsletter_token_idx").on(t.unsubscribeToken), index("newsletter_status_idx").on(t.status)])
