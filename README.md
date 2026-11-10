# ShopKart

An e-commerce app built with Next.js, Drizzle ORM and Postgres.

## Stack

- Next.js 16 (App Router, Turbopack) and React 19
- Tailwind CSS 4 and shadcn/ui
- Drizzle ORM with PostgreSQL (`pg`)
- Razorpay for payments

## Getting started

Requires Node.js, pnpm and Docker.

```bash
pnpm install

# 1. Start Postgres (host port 5433)
docker compose up -d --wait

# 2. Configure the environment
echo 'DATABASE_URL=postgres://shopkart:shopkart@localhost:5433/shopkart' > .env

# 3. Create the tables and load sample data
pnpm db:migrate
pnpm db:seed

# 4. Run the app
pnpm dev
```

The app runs at http://localhost:3000.

The seed script adds 4 categories, 10 products and a local admin user
(`admin@shopkart.local`, password `admin12345`, or set `SEED_ADMIN_PASSWORD`).
It is safe to re-run and refuses to run when `NODE_ENV=production`.

## Scripts

| Command            | What it does                                |
| ------------------ | ------------------------------------------- |
| `pnpm dev`         | Start the dev server                        |
| `pnpm build`       | Build for production                        |
| `pnpm start`       | Run the production build                    |
| `pnpm lint`        | Run ESLint                                  |
| `pnpm typecheck`   | Generate Next types and run `tsc`           |
| `pnpm test`        | Run unit tests (Vitest)                     |
| `pnpm test:e2e`    | Run end-to-end tests (Playwright)           |
| `pnpm db:generate` | Generate a SQL migration from the schema    |
| `pnpm db:migrate`  | Apply migrations to the database            |
| `pnpm db:studio`   | Open Drizzle Studio                         |
| `pnpm db:seed`     | Load sample data                            |

## Database

- Schema: `lib/db/schema.ts` (users, categories, products, orders, order_items)
- Client: `lib/db/index.ts` (server-only)
- Migrations: `drizzle/`
- Money is stored as integer paise (₹499 is `49900`).

After changing the schema, run `pnpm db:generate` then `pnpm db:migrate`, and
commit the new files in `drizzle/`.
