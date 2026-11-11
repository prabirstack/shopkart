// Attach refreshed artwork to existing campaigns without changing their schedule or publication state.
import { randomUUID } from "node:crypto"
import { copyFile, mkdir } from "node:fs/promises"
import path from "node:path"
import dotenv from "dotenv"
import pg from "pg"
import sharp from "sharp"

dotenv.config({ quiet: true })
dotenv.config({ path: ".env.local", override: true, quiet: true })
const artwork = { "Mega Tech Fest": "tech", "Weekend Deals": "promo-weekend", "Diwali Sale": "promo-weekend", "Winter Fashion": "style" }
const root = path.resolve(process.env.UPLOAD_DIR || ".data/uploads")
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
try {
  await client.connect()
  await client.query("BEGIN")
  for (const [title, slug] of Object.entries(artwork)) {
    const rows = (await client.query("SELECT id,image_url FROM banners WHERE title=$1 FOR UPDATE", [title])).rows
    for (const row of rows) {
      const key = `banners/${randomUUID()}.webp`
      const source = path.resolve("media/campaigns", `${slug}.webp`)
      const { width, height } = await sharp(source).metadata()
      await mkdir(path.join(root, "banners"), { recursive: true })
      await copyFile(source, path.join(root, key))
      const url = `/media/${key}`
      await client.query("UPDATE banners SET image_url=$1,image_alt=$2,image_width=$3,image_height=$4,updated_at=now() WHERE id=$5", [url, title + " campaign artwork", width, height, row.id])
      await client.query("INSERT INTO audit_events(action,entity,entity_id,before,after) VALUES('banner.update','banner',$1,$2::jsonb,$3::jsonb)", [row.id, JSON.stringify({ imageUrl: row.image_url }), JSON.stringify({ imageUrl: url, artwork: slug })])
      console.log(`Updated artwork: ${title}`)
    }
  }
  await client.query("COMMIT")
} catch (error) {
  await client.query("ROLLBACK").catch(() => {})
  throw error
} finally {
  await client.end()
}
