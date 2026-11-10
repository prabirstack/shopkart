CREATE TYPE "article_category" AS ENUM('buying_guide', 'product_review', 'comparison', 'news');--> statement-breakpoint
CREATE TYPE "article_product_kind" AS ENUM('featured', 'compare');--> statement-breakpoint
CREATE TYPE "article_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "banner_slot" AS ENUM('home_hero', 'home_promo_grid', 'category_banner', 'cart_banner');--> statement-breakpoint
CREATE TYPE "coupon_kind" AS ENUM('percent', 'flat');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('created', 'captured', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "product_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "return_status" AS ENUM('requested', 'approved', 'received', 'refunded', 'rejected');--> statement-breakpoint
CREATE TYPE "review_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "stock_reason" AS ENUM('restock', 'sale', 'damage', 'return', 'correction', 'reservation_release');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('customer', 'owner', 'catalog_editor', 'warehouse', 'support', 'finance');--> statement-breakpoint
CREATE SEQUENCE "public"."order_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 10500 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."return_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 2100 CACHE 1;--> statement-breakpoint
CREATE TABLE "addresses" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"label" text DEFAULT 'Home' NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"pincode" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"email" text NOT NULL,
	"phone" text,
	"name" text NOT NULL,
	"password_hash" text,
	"role" "user_role" DEFAULT 'customer'::"user_role" NOT NULL,
	"email_verified_at" timestamp with time zone,
	"phone_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"slug" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" text DEFAULT '' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"category_id" uuid NOT NULL,
	"brand_id" uuid NOT NULL,
	"tax_category_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"sku" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price_paise" integer NOT NULL,
	"compare_paise" integer,
	"badge" text,
	"status" "product_status" DEFAULT 'draft'::"product_status" NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"rating_sum" integer DEFAULT 0 NOT NULL,
	"seo_title" text DEFAULT '' NOT NULL,
	"seo_description" text DEFAULT '' NOT NULL,
	"search_vector" tsvector GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(sku, ''))) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_price_positive" CHECK ("price_paise" > 0),
	CONSTRAINT "products_compare_above_price" CHECK ("compare_paise" is null or "compare_paise" > "price_paise"),
	CONSTRAINT "products_rating_totals" CHECK ("rating_count" >= 0 and "rating_sum" >= 0 and "rating_sum" <= "rating_count" * 5)
);
--> statement-breakpoint
CREATE TABLE "tax_categories" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"hsn" text,
	"rate_percent" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tax_rate_allowed" CHECK ("rate_percent" in (0, 5, 12, 18, 28))
);
--> statement-breakpoint
CREATE TABLE "stock_levels" (
	"product_id" uuid PRIMARY KEY,
	"on_hand" integer DEFAULT 0 NOT NULL,
	"reserved" integer DEFAULT 0 NOT NULL,
	"reorder_at" integer DEFAULT 10 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_on_hand_non_negative" CHECK ("on_hand" >= 0),
	CONSTRAINT "stock_reserved_non_negative" CHECK ("reserved" >= 0),
	CONSTRAINT "stock_reserved_within_on_hand" CHECK ("reserved" <= "on_hand")
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"product_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" "stock_reason" NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"actor_id" uuid,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_movement_non_zero" CHECK ("delta" <> 0)
);
--> statement-breakpoint
CREATE TABLE "coupon_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"coupon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"code" text NOT NULL,
	"kind" "coupon_kind" NOT NULL,
	"value" integer NOT NULL,
	"min_order_paise" integer DEFAULT 0 NOT NULL,
	"usage_limit" integer NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_upper" CHECK ("code" = upper("code")),
	CONSTRAINT "coupons_value_valid" CHECK (("kind" = 'percent' and "value" between 1 and 90) or ("kind" = 'flat' and "value" > 0)),
	CONSTRAINT "coupons_usage_within_limit" CHECK ("used_count" >= 0 and "used_count" <= "usage_limit")
);
--> statement-breakpoint
CREATE TABLE "order_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"order_id" uuid NOT NULL,
	"status" "order_status" NOT NULL,
	"actor_id" uuid,
	"actor_label" text DEFAULT 'System' NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"title" text NOT NULL,
	"sku" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"gst_percent" smallint NOT NULL,
	CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0),
	CONSTRAINT "order_items_price_positive" CHECK ("unit_price_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"number" text DEFAULT 'SK-' || nextval('order_number_seq') NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending'::"order_status" NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"discount_paise" integer DEFAULT 0 NOT NULL,
	"shipping_paise" integer DEFAULT 0 NOT NULL,
	"gst_included_paise" integer DEFAULT 0 NOT NULL,
	"total_paise" integer NOT NULL,
	"coupon_id" uuid,
	"coupon_code" text,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"ship_to" jsonb NOT NULL,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_amounts_non_negative" CHECK ("subtotal_paise" >= 0 and "discount_paise" >= 0 and "shipping_paise" >= 0 and "total_paise" >= 0),
	CONSTRAINT "orders_total_adds_up" CHECK ("total_paise" = "subtotal_paise" - "discount_paise" + "shipping_paise"),
	CONSTRAINT "orders_discount_within_subtotal" CHECK ("discount_paise" <= "subtotal_paise")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'razorpay' NOT NULL,
	"provider_order_id" text NOT NULL,
	"provider_payment_id" text,
	"amount_paise" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'created'::"payment_status" NOT NULL,
	"method" text,
	"signature_verified_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_positive" CHECK ("amount_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "returns" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"number" text DEFAULT 'RT-' || nextval('return_number_seq') NOT NULL,
	"order_id" uuid NOT NULL,
	"status" "return_status" DEFAULT 'requested'::"return_status" NOT NULL,
	"reason" text NOT NULL,
	"refund_paise" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "returns_refund_non_negative" CHECK ("refund_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "article_products" (
	"article_id" uuid,
	"product_id" uuid,
	"kind" "article_product_kind",
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "article_products_pkey" PRIMARY KEY("article_id","product_id","kind")
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"category" "article_category" NOT NULL,
	"author_name" text DEFAULT 'Team ShopKart' NOT NULL,
	"status" "article_status" DEFAULT 'draft'::"article_status" NOT NULL,
	"published_at" timestamp with time zone,
	"doc" jsonb NOT NULL,
	"seo_title" text DEFAULT '' NOT NULL,
	"seo_description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "articles_published_has_date" CHECK ("status" = 'draft' or "published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"title" text NOT NULL,
	"slot" "banner_slot" NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"href" text NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "banners_dates_ordered" CHECK ("ends_at" >= "starts_at"),
	CONSTRAINT "banners_href_internal" CHECK ("href" like '/%')
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"product_id" uuid NOT NULL,
	"user_id" uuid,
	"author_name" text NOT NULL,
	"rating" smallint NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"status" "review_status" DEFAULT 'pending'::"review_status" NOT NULL,
	"verified_purchase" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("rating" between 1 and 5),
	CONSTRAINT "reviews_text_lengths" CHECK (char_length("title") between 3 and 80 and char_length("body") between 20 and 1500)
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"user_id" uuid,
	"product_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wishlist_items_pkey" PRIMARY KEY("user_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE INDEX "addresses_user_idx" ON "addresses" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "addresses_one_default_idx" ON "addresses" ("user_id") WHERE "is_default";--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_idx" ON "sessions" ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expiry_idx" ON "sessions" ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower_idx" ON "users" (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_phone_idx" ON "users" ("phone") WHERE "phone" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "brands_name_idx" ON "brands" (lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" ("slug");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" ("product_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_idx" ON "products" ("sku");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" ("category_id","status");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" ("brand_id");--> statement-breakpoint
CREATE INDEX "products_search_idx" ON "products" USING gin ("search_vector");--> statement-breakpoint
CREATE UNIQUE INDEX "tax_categories_name_idx" ON "tax_categories" ("name");--> statement-breakpoint
CREATE INDEX "stock_movements_product_idx" ON "stock_movements" ("product_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_movements_reference_idx" ON "stock_movements" ("reference","reason") WHERE "reference" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_order_idx" ON "coupon_redemptions" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_redemptions_user_idx" ON "coupon_redemptions" ("coupon_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" ("code");--> statement-breakpoint
CREATE INDEX "order_events_order_idx" ON "order_events" ("order_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_product_idx" ON "order_items" ("order_id","product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_idx" ON "orders" ("number");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" ("user_id","placed_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" ("status","placed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_order_idx" ON "payments" ("provider","provider_order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_payment_idx" ON "payments" ("provider","provider_payment_id") WHERE "provider_payment_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_one_captured_per_order" ON "payments" ("order_id") WHERE "status" = 'captured';--> statement-breakpoint
CREATE INDEX "payments_order_idx" ON "payments" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "returns_number_idx" ON "returns" ("number");--> statement-breakpoint
CREATE INDEX "returns_order_idx" ON "returns" ("order_id");--> statement-breakpoint
CREATE INDEX "returns_status_idx" ON "returns" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_events_provider_event_idx" ON "webhook_events" ("provider","event_id");--> statement-breakpoint
CREATE INDEX "article_products_product_idx" ON "article_products" ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "articles_slug_idx" ON "articles" ("slug");--> statement-breakpoint
CREATE INDEX "articles_listing_idx" ON "articles" ("status","published_at");--> statement-breakpoint
CREATE INDEX "banners_active_idx" ON "banners" ("slot","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" ("product_id","status","created_at");--> statement-breakpoint
CREATE INDEX "reviews_moderation_idx" ON "reviews" ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_one_per_user_idx" ON "reviews" ("product_id","user_id") WHERE "user_id" is not null;--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_events" ("entity","entity_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_actor_idx" ON "audit_events" ("actor_id","created_at");--> statement-breakpoint
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tax_category_id_tax_categories_id_fkey" FOREIGN KEY ("tax_category_id") REFERENCES "tax_categories"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_coupons_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_coupons_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "article_products" ADD CONSTRAINT "article_products_article_id_articles_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "article_products" ADD CONSTRAINT "article_products_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL;