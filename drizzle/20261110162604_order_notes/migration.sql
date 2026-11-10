CREATE TABLE "order_notes" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"order_id" uuid NOT NULL,
	"author_id" uuid,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_notes_body_length" CHECK (char_length("body") between 1 and 1000)
);
--> statement-breakpoint
CREATE INDEX "order_notes_order_idx" ON "order_notes" ("order_id","created_at");--> statement-breakpoint
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_order_id_orders_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_notes" ADD CONSTRAINT "order_notes_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL;