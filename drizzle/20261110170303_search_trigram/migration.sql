-- Typo-tolerant product search: trigram similarity on titles (pg_trgm ships with PostgreSQL).
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "products_title_trgm_idx" ON "products" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "brands_name_trgm_idx" ON "brands" USING gin ("name" gin_trgm_ops);
