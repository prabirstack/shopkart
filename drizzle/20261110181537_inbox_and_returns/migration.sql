CREATE TYPE "contact_status" AS ENUM('new', 'read', 'resolved');--> statement-breakpoint
CREATE TYPE "newsletter_status" AS ENUM('subscribed', 'unsubscribed');--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"return_id" uuid NOT NULL,
	"order_item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "return_items_quantity_positive" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"email" text NOT NULL,
	"topic" text NOT NULL,
	"order_number" text,
	"message" text NOT NULL,
	"status" "contact_status" DEFAULT 'new'::"contact_status" NOT NULL,
	"user_id" uuid,
	"handled_by" uuid,
	"handled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_messages_lengths" CHECK (char_length("name") between 2 and 80 and char_length("message") between 10 and 2000)
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"email" text NOT NULL,
	"status" "newsletter_status" DEFAULT 'subscribed'::"newsletter_status" NOT NULL,
	"unsubscribe_token" text NOT NULL,
	"source" text DEFAULT 'footer' NOT NULL,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN "requested_by" uuid;--> statement-breakpoint
ALTER TABLE "returns" ADD COLUMN "received_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "return_items_line_idx" ON "return_items" ("return_id","order_item_id");--> statement-breakpoint
CREATE INDEX "return_items_order_item_idx" ON "return_items" ("order_item_id");--> statement-breakpoint
CREATE INDEX "contact_messages_status_idx" ON "contact_messages" ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_email_idx" ON "newsletter_subscribers" (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_token_idx" ON "newsletter_subscribers" ("unsubscribe_token");--> statement-breakpoint
CREATE INDEX "newsletter_status_idx" ON "newsletter_subscribers" ("status");--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_returns_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_order_items_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_requested_by_users_id_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_handled_by_users_id_fkey" FOREIGN KEY ("handled_by") REFERENCES "users"("id") ON DELETE SET NULL;