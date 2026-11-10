import "dotenv/config";

import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { categories, products, users } from "../lib/db/schema";

// NOTE: this script builds its own pool instead of importing lib/db, because
// lib/db imports "server-only", which throws when run outside Next.js.

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to seed a production database.");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Prices are in paise (₹1 = 100 paise).
const rupees = (n: number) => n * 100;

const categorySeed = [
  { name: "Electronics", slug: "electronics" },
  { name: "Fashion", slug: "fashion" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
  { name: "Books", slug: "books" },
];

const productSeed = [
  { category: "electronics", name: "Wireless Earbuds", slug: "wireless-earbuds", price: 1999, stock: 120, description: "Bluetooth 5.3 earbuds with 24-hour battery life." },
  { category: "electronics", name: "Mechanical Keyboard", slug: "mechanical-keyboard", price: 3499, stock: 45, description: "Hot-swappable 75% keyboard with tactile switches." },
  { category: "electronics", name: "Power Bank 20000mAh", slug: "power-bank-20000", price: 1799, stock: 80, description: "Fast-charging power bank with dual USB-C ports." },
  { category: "fashion", name: "Cotton Crew T-Shirt", slug: "cotton-crew-tshirt", price: 499, stock: 300, description: "Soft 100% cotton tee in a regular fit." },
  { category: "fashion", name: "Slim Fit Jeans", slug: "slim-fit-jeans", price: 1499, stock: 150, description: "Stretch denim, mid-rise, slim fit." },
  { category: "fashion", name: "Running Shoes", slug: "running-shoes", price: 2799, stock: 60, description: "Lightweight breathable shoes for daily runs." },
  { category: "home-kitchen", name: "Stainless Steel Bottle", slug: "steel-bottle-1l", price: 599, stock: 200, description: "1 litre insulated bottle, keeps drinks cold for 24 hours." },
  { category: "home-kitchen", name: "Non-Stick Frying Pan", slug: "non-stick-frying-pan", price: 899, stock: 90, description: "26 cm induction-compatible non-stick pan." },
  { category: "books", name: "Atomic Habits", slug: "atomic-habits", price: 449, stock: 250, description: "Small changes, remarkable results." },
  { category: "books", name: "The Pragmatic Programmer", slug: "pragmatic-programmer", price: 1299, stock: 40, description: "Your journey to mastery, 20th anniversary edition." },
];

async function main() {
  // Categories
  await db.insert(categories).values(categorySeed).onConflictDoNothing();
  const categoryRows = await db.select().from(categories);
  const categoryIdBySlug = new Map(categoryRows.map((c) => [c.slug, c.id]));

  // Products
  await db
    .insert(products)
    .values(
      productSeed.map(({ category, price, ...p }) => ({
        ...p,
        pricePaise: rupees(price),
        categoryId: categoryIdBySlug.get(category) ?? null,
      })),
    )
    .onConflictDoNothing();

  // Dev admin user (credentials are for local development only)
  const adminEmail = "admin@shopkart.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail));

  if (existing.length === 0) {
    await db.insert(users).values({
      email: adminEmail,
      name: "Admin",
      role: "admin",
      passwordHash: await argon2.hash(adminPassword),
      emailVerifiedAt: new Date(),
    });
  }

  console.log(
    `Seeded: ${categoryRows.length} categories, ${productSeed.length} products, admin ${adminEmail}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
