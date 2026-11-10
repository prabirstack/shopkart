DROP INDEX "product_images_product_idx";--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "width" integer;--> statement-breakpoint
ALTER TABLE "product_images" ADD COLUMN "height" integer;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "image_alt" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "image_width" integer;--> statement-breakpoint
ALTER TABLE "banners" ADD COLUMN "image_height" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "product_images_position_idx" ON "product_images" ("product_id","position");--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_alt_len" CHECK (char_length("alt") <= 160);--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_position" CHECK ("position" >= 0);--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_url" CHECK ("url" like '/media/products/%' or "url" like '/images/products/%');--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_image_alt_len" CHECK (char_length("image_alt") <= 160);--> statement-breakpoint
ALTER TABLE "banners" ADD CONSTRAINT "banners_image_url" CHECK ("image_url" is null or "image_url" like '/media/banners/%');