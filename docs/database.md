# Database

PostgreSQL 18 with Drizzle ORM. Schema lives in `lib/db/schema/` (one file per area), migrations in `drizzle/`.

## Run it

```bash
docker compose up -d db          # Postgres on localhost:5433
cp .env.example .env             # then fill in DATABASE_URL and BETTER_AUTH_SECRET
pnpm db:migrate                  # apply migrations
pnpm db:seed                     # load the store's sample data (local only)
pnpm test                        # integration tests run against the separate *_test database
```

Change the schema, then `pnpm db:generate` and commit the new folder under `drizzle/`.
Never edit a migration that has been applied elsewhere.

## Rules the database enforces itself

Constraints live in the database so no code path (or hand-written SQL) can break them.

| Rule | How |
| --- | --- |
| Money is integer paise | `integer` columns, never floats |
| Price above zero; original price above selling price | `CHECK` on `products` |
| Stock never negative; reserved never above on-hand | `CHECK` on `stock_levels` |
| Order total = subtotal - discount + shipping | `CHECK` on `orders` |
| Only one captured payment per order | partial unique index on `payments` |
| One review per customer per product | partial unique index on `reviews` |
| One use of a coupon per customer; usage never above the limit | unique index + `CHECK` |
| A repeated checkout request returns the same order | unique `(user_id, idempotency_key)` |
| A repeated webhook is processed once | unique `(provider, event_id)` |
| Valid GST rates only | `CHECK (0, 5, 12, 18, 28)` |

## Data access

`lib/db/queries/*` is the only place pages and APIs read or write data. Functions return plain DTOs,
run multi-step work in a transaction, and throw `DomainError` for expected failures (out of stock, bad coupon).

* **Orders** lock stock rows in a fixed order, check availability, validate the coupon, price on the server
  from database prices, reserve stock and write the order, all in one transaction.
  Two shoppers racing for the last unit cannot both succeed.
* **Payments**: `markOrderPaid` is idempotent. Reserved units become a sale exactly once.
* **Stock** is a ledger (`stock_movements`); levels change in the same transaction as the movement.
* **Reviews**: moderation keeps `products.rating_count/rating_sum` exactly in step (row-locked).

Pages still render the demo data in `features/*/demo.ts`; switch each page to these queries feature by feature.
