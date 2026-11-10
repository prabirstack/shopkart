import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { Pool } from "pg"

/** Creates the test database if needed and applies every migration to it. */
export default async function setup() {
  const url = process.env.DATABASE_URL!
  const name = new URL(url).pathname.slice(1)
  if (!name.endsWith("_test")) throw new Error(`Refusing to migrate "${name}": not a test database`)

  const admin = new Pool({ connectionString: url.replace(/\/[^/?]+(\?.*)?$/, "/postgres$1") })
  const exists = await admin.query("select 1 from pg_database where datname = $1", [name])
  if (exists.rowCount === 0) await admin.query(`create database "${name}"`)
  await admin.end()

  const pool = new Pool({ connectionString: url })
  await migrate(drizzle({ client: pool }), { migrationsFolder: "./drizzle" })
  await pool.end()
}
