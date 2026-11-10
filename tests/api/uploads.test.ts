import { mkdtemp, readdir, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { eq } from "drizzle-orm"
import sharp from "sharp"

import { POST as upload } from "../../app/api/v1/admin/uploads/route"
import { GET as media } from "../../app/media/[...path]/route"
import { POST as createProductRoute } from "../../app/api/v1/admin/products/route"
import { PATCH as patchProduct } from "../../app/api/v1/admin/products/[id]/route"
import { POST as createBannerRoute } from "../../app/api/v1/admin/banners/route"
import { PATCH as patchBanner, DELETE as deleteBannerRoute } from "../../app/api/v1/admin/banners/[id]/route"
import { resetRateLimits } from "../../lib/api/rate-limit"
import { listActiveBannersWithImage } from "../../lib/db/queries"
import { deleteProducts } from "../../lib/db/queries/admin"
import { sniffImageType } from "../../lib/image-processing"
import { db } from "../../lib/db"
import * as s from "../../lib/db/schema"
import { makeCatalog, makeProduct, resetDb } from "../helpers"
import { ctx, json, ORIGIN, req, signUp } from "./helpers"

let dir: string
beforeAll(async () => { dir = await mkdtemp(path.join(tmpdir(), "shopkart-uploads-")); process.env.UPLOAD_DIR = dir })
afterAll(async () => { await rm(dir, { recursive: true, force: true }); delete process.env.UPLOAD_DIR })
beforeEach(async () => { await resetDb(); await rm(dir, { recursive: true, force: true }) })

const png = (w = 800, h = 800) => sharp({ create: { width: w, height: h, channels: 3, background: "#e11d48" } }).png().toBuffer()
const jpegWithExif = () => sharp({ create: { width: 900, height: 600, channels: 3, background: "#0ea5e9" } }).withExif({ IFD0: { Copyright: "secret", Make: "SpyCam" } }).jpeg().toBuffer()

function send(cookie: string | undefined, bytes: Uint8Array | string, o: { kind?: string; name?: string; type?: string; headers?: Record<string, string> } = {}) {
  const fd = new FormData()
  if (o.kind !== "") fd.set("kind", o.kind ?? "product")
  fd.set("file", new File([bytes as BlobPart], o.name ?? "photo.png", { type: o.type ?? "image/png" }))
  return upload(new Request(`${ORIGIN}/api/v1/admin/uploads`, { method: "POST", body: fd, headers: { origin: ORIGIN, ...(cookie ? { cookie } : {}), ...o.headers } }))
}
const up = async (cookie: string, kind = "product", bytes?: Buffer) => (await json(await send(cookie, bytes ?? (await png()), { kind }))).body.data as { url: string; width: number; height: number; bytes: number }
const files = async (sub: string) => readdir(path.join(dir, sub)).catch(() => [] as string[])
const fetchMedia = (url: string) => media(new Request(`${ORIGIN}${url}`), { params: Promise.resolve({ path: url.replace("/media/", "").split("/") }) })

describe("upload validation", () => {
  it("re-encodes a real PNG to WebP and returns url, size and bytes", async () => {
    const { cookie } = await signUp("catalog_editor")
    const r = await json(await send(cookie, await png(1000, 500)))
    expect(r.status).toBe(201)
    expect(r.body.data.url).toMatch(/^\/media\/products\/[0-9a-f-]{36}\.webp$/)
    expect(r.body.data).toMatchObject({ width: 1000, height: 500 })
    expect(r.body.data.bytes).toBeGreaterThan(0)
    expect(await files("products")).toHaveLength(1)
  })

  it("accepts JPEG and WebP too, and never uses the client's file name", async () => {
    const { cookie } = await signUp("owner")
    const jpg = await sharp({ create: { width: 500, height: 500, channels: 3, background: "#fff" } }).jpeg().toBuffer()
    const webp = await sharp({ create: { width: 500, height: 500, channels: 3, background: "#fff" } }).webp().toBuffer()
    expect((await json(await send(cookie, jpg, { name: "../../evil.php", type: "image/jpeg" }))).status).toBe(201)
    expect((await json(await send(cookie, webp, { name: "x.webp", type: "image/webp" }))).status).toBe(201)
    expect((await files("products")).every((f) => /^[0-9a-f-]{36}\.webp$/.test(f))).toBe(true)
  })

  it("rejects HTML named .png and SVG by content, whatever the client claims", async () => {
    const { cookie } = await signUp("owner")
    const html = await json(await send(cookie, "<html><script>alert(1)</script></html>", { name: "a.png", type: "image/png" }))
    expect(html.status).toBe(422); expect(html.body.error.code).toBe("IMAGE_INVALID")
    const svg = await json(await send(cookie, '<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>', { name: "a.svg", type: "image/svg+xml" }))
    expect(svg.status).toBe(422)
    const gif = await json(await send(cookie, Buffer.from("GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;", "binary"), { type: "image/gif" }))
    expect(gif.status).toBe(422)
    expect(await files("products")).toHaveLength(0)
  })

  it("rejects a corrupt image that has valid magic bytes", async () => {
    const { cookie } = await signUp("owner")
    const bad = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from("not really a png at all")])
    expect((await json(await send(cookie, bad))).status).toBe(422)
  })

  it("sniffs AVIF and refuses HEIC", () => {
    const box = (brand: string) => Uint8Array.from([0, 0, 0, 24, ...Buffer.from(`ftyp${brand}`), 0, 0, 0, 0, 0, 0, 0, 0])
    expect(sniffImageType(box("avif"))).toBe("avif")
    expect(sniffImageType(box("heic"))).toBeNull()
  })

  it("enforces the size limits: over 5 MB is 413, and a bigger body is refused before it is read", async () => {
    const { cookie } = await signUp("owner")
    const big = Buffer.alloc(5 * 1024 * 1024 + 1, 1)
    const r = await json(await send(cookie, big))
    expect(r.status).toBe(413)
    const huge = await json(await send(cookie, Buffer.alloc(7 * 1024 * 1024), { headers: { "content-length": String(7 * 1024 * 1024) } }))
    expect(huge.status).toBe(413)
  })

  it("enforces dimensions: too small for a product, too large a source", async () => {
    const { cookie } = await signUp("owner")
    const small = await json(await send(cookie, await png(300, 300)))
    expect(small.status).toBe(422); expect(small.body.error.code).toBe("IMAGE_TOO_SMALL"); expect(small.body.error.message).toContain("400")
    const huge = await sharp({ create: { width: 6001, height: 10, channels: 3, background: "#000" } }).png().toBuffer()
    const r = await json(await send(cookie, huge))
    expect(r.status).toBe(422); expect(r.body.error.code).toBe("IMAGE_TOO_BIG")
  })

  it("scales products to 2000 px and banners to 2400 px wide, keeping the aspect ratio", async () => {
    const { cookie } = await signUp("owner")
    const p = await up(cookie, "product", await png(4000, 3000))
    expect(p).toMatchObject({ width: 2000, height: 1500 })
    const b = await up(cookie, "banner", await png(3200, 1200))
    expect(b).toMatchObject({ width: 2400, height: 900 })
    expect(b.url).toMatch(/^\/media\/banners\//)
  })

  it("strips EXIF and GPS metadata", async () => {
    const { cookie } = await signUp("owner")
    const src = await jpegWithExif()
    expect((await sharp(src).metadata()).exif).toBeTruthy()
    const out = await up(cookie, "product", src)
    const stored = Buffer.from(await (await fetchMedia(out.url)).arrayBuffer())
    const meta = await sharp(stored).metadata()
    expect(meta.format).toBe("webp"); expect(meta.exif).toBeUndefined()
    expect(stored.includes(Buffer.from("SpyCam"))).toBe(false)
  })

  it("applies EXIF rotation instead of keeping it as metadata", async () => {
    const { cookie } = await signUp("owner")
    const sideways = await sharp({ create: { width: 800, height: 500, channels: 3, background: "#222" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer()
    const out = await up(cookie, "product", sideways)
    expect(out).toMatchObject({ width: 500, height: 800 })
  })

  it("needs a kind and a file", async () => {
    const { cookie } = await signUp("owner")
    expect((await json(await send(cookie, await png(), { kind: "" }))).status).toBe(422)
    expect((await json(await send(cookie, await png(), { kind: "avatar" }))).status).toBe(422)
    const noFile = new FormData(); noFile.set("kind", "product")
    expect((await json(await upload(new Request(`${ORIGIN}/api/v1/admin/uploads`, { method: "POST", body: noFile, headers: { origin: ORIGIN, cookie } })))).status).toBe(422)
    const asJson = await json(await upload(req("/api/v1/admin/uploads", { method: "POST", body: { kind: "product" }, cookie })))
    expect(asJson.status).toBe(415)
  })
})

describe("upload permissions and rate limit", () => {
  it("follows the permission matrix", async () => {
    const png1 = await png()
    const status = async (role: Parameters<typeof signUp>[0], kind: string) => (await send((await signUp(role)).cookie, png1, { kind })).status
    expect(await status("catalog_editor", "product")).toBe(201)
    expect(await status("catalog_editor", "banner")).toBe(201)
    expect(await status("warehouse", "product")).toBe(403)
    expect(await status("support", "banner")).toBe(403)
    expect(await status("support", "product")).toBe(403)
    expect(await status("finance", "product")).toBe(403)
    expect(await status("customer", "product")).toBe(403)
    expect(await status("owner", "banner")).toBe(201)
    expect((await send(undefined, png1)).status).toBe(401)
  })

  it("rejects cross-site requests", async () => {
    const { cookie } = await signUp("owner")
    expect((await send(cookie, await png(), { headers: { origin: "https://evil.example" } })).status).toBe(403)
  })

  describe("rate limit", () => {
    beforeEach(() => { resetRateLimits(); process.env.DISABLE_RATE_LIMIT = "0" })
    afterEach(() => { process.env.DISABLE_RATE_LIMIT = "1"; resetRateLimits() })
    it("allows 30 a minute per account, then 429", async () => {
      const { cookie } = await signUp("owner")
      const tiny = Buffer.from("nope")
      let last = 0
      for (let i = 0; i < 31; i++) last = (await send(cookie, tiny)).status
      expect(last).toBe(429)
    })
  })
})

describe("media route", () => {
  it("serves a stored file with safe, immutable headers", async () => {
    const { cookie } = await signUp("owner")
    const { url } = await up(cookie)
    const res = await fetchMedia(url)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("image/webp")
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
    expect(res.headers.get("x-content-type-options")).toBe("nosniff")
    expect(res.headers.get("content-disposition")).toBe("inline")
    expect((await sharp(Buffer.from(await res.arrayBuffer())).metadata()).format).toBe("webp")
  })

  it("refuses traversal and anything that is not one of our keys", async () => {
    const { cookie } = await signUp("owner")
    await up(cookie)
    const get = (parts: string[]) => media(new Request(`${ORIGIN}/media/x`), { params: Promise.resolve({ path: parts }) })
    for (const parts of [["..", "..", "package.json"], ["products", "..", "..", "package.json"], ["products", "%2e%2e%2fsecret"], ["products", "not-a-uuid.webp"], ["products", "00000000-0000-4000-8000-000000000000.svg"], ["other", "00000000-0000-4000-8000-000000000000.webp"], ["products"], []])
      expect((await get(parts)).status).toBe(404)
    expect((await get(["products", "00000000-0000-4000-8000-000000000000.webp"])).status).toBe(404)
  })
})

const body = (cat: Awaited<ReturnType<typeof makeCatalog>>, extra: object = {}) => ({
  title: "Camera Bag", slug: `camera-bag-${Math.random().toString(36).slice(2, 8)}`, sku: `CB-${Math.random().toString(36).slice(2, 8)}`, description: "A sturdy bag for your camera.",
  categorySlug: cat.electronics.slug, brandName: "Acme", gstPercent: 18, pricePaise: 99900, status: "draft", ...extra,
})

describe("product images", () => {
  it("replaces the whole set in one save: reorder, alt edit, remove and add", async () => {
    const { cookie, userId } = await signUp("catalog_editor"); void userId
    const cat = await makeCatalog(); const p = await makeProduct(cat)
    const [a, b, c] = [await up(cookie), await up(cookie), await up(cookie)]
    const save = (images: object[]) => patchProduct(req(`/api/v1/admin/products/${p.id}`, { method: "PATCH", body: { images }, cookie }), ctx({ id: p.id }))
    expect((await json(await save([{ url: a.url, alt: "A", width: 800, height: 800 }, { url: b.url, alt: "B" }]))).status).toBe(200)
    expect((await db.select().from(s.productImages).where(eq(s.productImages.productId, p.id)).orderBy(s.productImages.position)).map((i) => [i.url, i.alt, i.position])).toEqual([[a.url, "A", 0], [b.url, "B", 1]])
    expect((await json(await save([{ url: c.url, alt: "C" }, { url: b.url, alt: "B2" }]))).status).toBe(200)
    const rows = await db.select().from(s.productImages).where(eq(s.productImages.productId, p.id)).orderBy(s.productImages.position)
    expect(rows.map((i) => [i.url, i.alt, i.position])).toEqual([[c.url, "C", 0], [b.url, "B2", 1]])
  })

  it("deletes the files of removed photos, keeps the ones still used, and ignores demo files", async () => {
    const { cookie } = await signUp("owner")
    const cat = await makeCatalog(); const p = await makeProduct(cat)
    const [a, b] = [await up(cookie), await up(cookie)]
    const save = (images: object[]) => patchProduct(req(`/api/v1/admin/products/${p.id}`, { method: "PATCH", body: { images }, cookie }), ctx({ id: p.id }))
    await save([{ url: a.url }, { url: b.url }, { url: "/images/products/demo.webp" }])
    expect(await files("products")).toHaveLength(2)
    await save([{ url: b.url }])
    expect((await fetchMedia(a.url)).status).toBe(404)
    expect((await fetchMedia(b.url)).status).toBe(200)
    await save([])
    expect(await files("products")).toHaveLength(0)
  })

  it("does not delete a file another product still uses", async () => {
    const { cookie } = await signUp("owner")
    const cat = await makeCatalog(); const p1 = await makeProduct(cat); const p2 = await makeProduct(cat)
    const a = await up(cookie)
    for (const p of [p1, p2]) await patchProduct(req(`/api/v1/admin/products/${p.id}`, { method: "PATCH", body: { images: [{ url: a.url }] }, cookie }), ctx({ id: p.id }))
    await patchProduct(req(`/api/v1/admin/products/${p1.id}`, { method: "PATCH", body: { images: [] }, cookie }), ctx({ id: p1.id }))
    expect((await fetchMedia(a.url)).status).toBe(200)
  })

  it("deletes files when a product is deleted", async () => {
    const { cookie, userId } = await signUp("owner")
    const cat = await makeCatalog(); const p = await makeProduct(cat)
    const a = await up(cookie)
    await patchProduct(req(`/api/v1/admin/products/${p.id}`, { method: "PATCH", body: { images: [{ url: a.url }] }, cookie }), ctx({ id: p.id }))
    await deleteProducts([p.id], userId)
    expect(await files("products")).toHaveLength(0)
  })

  it("rejects foreign, malformed, banner and missing URLs, and leaves the old set untouched", async () => {
    const { cookie } = await signUp("owner")
    const cat = await makeCatalog(); const p = await makeProduct(cat)
    const good = await up(cookie); const banner = await up(cookie, "banner", await png(1200, 400))
    await patchProduct(req(`/api/v1/admin/products/${p.id}`, { method: "PATCH", body: { images: [{ url: good.url }] }, cookie }), ctx({ id: p.id }))
    const bad = ["https://evil.example/a.webp", "javascript:alert(1)", "data:image/png;base64,AAAA", "//evil.example/a.webp", "/media/../../etc/passwd", "/media/products/../banners/x.webp", "/images/products/../../secret.webp", "/media/products/not-a-uuid.webp", banner.url, "/media/products/00000000-0000-4000-8000-000000000000.svg"]
    for (const url of bad) {
      const r = await json(await patchProduct(req(`/api/v1/admin/products/${p.id}`, { method: "PATCH", body: { images: [{ url }] }, cookie }), ctx({ id: p.id })))
      expect(r.status, url).toBe(422)
    }
    // well-formed key whose file does not exist
    const ghost = await json(await patchProduct(req(`/api/v1/admin/products/${p.id}`, { method: "PATCH", body: { images: [{ url: "/media/products/00000000-0000-4000-8000-000000000000.webp" }] }, cookie }), ctx({ id: p.id })))
    expect(ghost.status).toBe(422); expect(ghost.body.error.code).toBe("INVALID_IMAGE")
    expect((await db.select().from(s.productImages).where(eq(s.productImages.productId, p.id))).map((i) => i.url)).toEqual([good.url])
  })

  it("allows at most 8 photos, no duplicates, and alt text up to 160 characters", async () => {
    const { cookie } = await signUp("owner")
    const cat = await makeCatalog()
    const imgs = []
    for (let i = 0; i < 9; i++) imgs.push({ url: (await up(cookie)).url })
    const make = (images: object[]) => createProductRoute(req("/api/v1/admin/products", { method: "POST", body: body(cat, { images }), cookie })).then(json)
    const nine = await make(imgs)
    expect(nine.status).toBe(422); expect(JSON.stringify(nine.body)).toContain("at most 8")
    expect((await make([imgs[0], imgs[0]])).status).toBe(422)
    expect((await make([{ ...imgs[0], alt: "x".repeat(161) }])).status).toBe(422)
    const ok8 = await make(imgs.slice(0, 8).map((i, n) => ({ ...i, alt: `photo ${n}` })))
    expect(ok8.status).toBe(201)
    expect(await db.select().from(s.productImages)).toHaveLength(8)
  })

  it("enforces unique positions and the url shape in the database", async () => {
    const cat = await makeCatalog(); const p = await makeProduct(cat)
    const row = { productId: p.id, url: "/images/products/a.webp", position: 0 }
    await db.insert(s.productImages).values(row)
    await expect(db.insert(s.productImages).values({ ...row, url: "/images/products/b.webp" })).rejects.toThrow()
    await expect(db.insert(s.productImages).values({ ...row, position: 1, url: "https://x.example/a.webp" })).rejects.toThrow()
    await expect(db.insert(s.productImages).values({ ...row, position: -1 })).rejects.toThrow()
  })
})

describe("banner images", () => {
  const banner = (extra: object = {}) => ({ title: "Diwali Sale", slot: "home_hero", startsAt: new Date(Date.now() - 86_400_000).toISOString(), endsAt: new Date(Date.now() + 86_400_000).toISOString(), href: "/deals", ...extra })

  it("stores a banner image, rejects foreign urls and product keys, and removes with null", async () => {
    const { cookie } = await signUp("catalog_editor")
    const img = await up(cookie, "banner", await png(1600, 600)); const prod = await up(cookie)
    const made = await json(await createBannerRoute(req("/api/v1/admin/banners", { method: "POST", body: banner({ image: { url: img.url, alt: "Sale", width: 1600, height: 600 } }), cookie })))
    expect(made.status).toBe(201); expect(made.body.data).toMatchObject({ imageUrl: img.url, imageAlt: "Sale", imageWidth: 1600 })
    for (const url of ["https://evil.example/x.webp", prod.url, "javascript:alert(1)"])
      expect((await json(await createBannerRoute(req("/api/v1/admin/banners", { method: "POST", body: banner({ image: { url } }), cookie })))).status, url).toBe(422)
    expect((await json(await createBannerRoute(req("/api/v1/admin/banners", { method: "POST", body: banner(), cookie })))).status).toBe(201)
    const id = made.body.data.id
    const cleared = await json(await patchBanner(req(`/api/v1/admin/banners/${id}`, { method: "PATCH", body: { image: null }, cookie }), ctx({ id })))
    expect(cleared.body.data).toMatchObject({ imageUrl: null, imageAlt: "" })
    expect((await fetchMedia(img.url)).status).toBe(404) // orphan removed
  })

  it("deletes the file when the banner is deleted or its image is replaced", async () => {
    const { cookie } = await signUp("owner")
    const one = await up(cookie, "banner", await png(1600, 600)); const two = await up(cookie, "banner", await png(1600, 600))
    const made = await json(await createBannerRoute(req("/api/v1/admin/banners", { method: "POST", body: banner({ image: { url: one.url } }), cookie })))
    const id = made.body.data.id
    await patchBanner(req(`/api/v1/admin/banners/${id}`, { method: "PATCH", body: { image: { url: two.url } }, cookie }), ctx({ id }))
    expect((await fetchMedia(one.url)).status).toBe(404); expect((await fetchMedia(two.url)).status).toBe(200)
    await deleteBannerRoute(req(`/api/v1/admin/banners/${id}`, { method: "DELETE", cookie }), ctx({ id }))
    expect((await fetchMedia(two.url)).status).toBe(404)
  })

  it("support cannot attach banner images (banners:write)", async () => {
    const { cookie } = await signUp("support")
    expect((await json(await createBannerRoute(req("/api/v1/admin/banners", { method: "POST", body: banner(), cookie })))).status).toBe(403)
  })

  it("the hero loader returns only live, unpaused banners that have an image, in the right slot", async () => {
    const day = 86_400_000, now = Date.now()
    const row = (o: Partial<typeof s.banners.$inferInsert>) => ({ title: "B", slot: "home_hero" as const, startsAt: new Date(now - day), endsAt: new Date(now + day), href: "/x", imageUrl: "/media/banners/00000000-0000-4000-8000-000000000001.webp", ...o })
    await db.insert(s.banners).values([
      row({ title: "live with image" }),
      row({ title: "no image", imageUrl: null }),
      row({ title: "paused", isPaused: true }),
      row({ title: "ended", startsAt: new Date(now - 3 * day), endsAt: new Date(now - day) }),
      row({ title: "scheduled", startsAt: new Date(now + day), endsAt: new Date(now + 2 * day) }),
      row({ title: "other slot", slot: "cart_banner" }),
    ])
    expect((await listActiveBannersWithImage("home_hero")).map((b) => b.title)).toEqual(["live with image"])
  })
})
