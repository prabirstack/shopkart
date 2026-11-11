# Product, category and hero images

There are two ways photos get on the store: **uploads in the admin** (products and banners) and **demo files** in
`public/images` (categories, and demo product photos). A missing photo never breaks a page: everything falls back to
the icon placeholder.

## Uploading in the admin

* **Products:** Admin > Products > (a product) > Media. Drag photos in or browse, reorder, pick the main photo (the first
  one is the card image), write a description for screen readers, remove. Up to 8 photos. Changes are saved with the
  product (the Save button), not when you drop a file.
* **Banners:** Admin > Banners > Schedule banner / Edit. One image per banner, with the recommended size for the
  placement. Only the **Home hero** placement shows on the storefront today; when it has live banners with an image, they
  replace the built-in slides, otherwise the built-in slides show.

Rules (checked in the browser and again on the server): JPG, PNG, WebP or AVIF only (by file content, so a renamed
file or an SVG is refused), 5 MB per file, at most 6000 x 6000 px, at least 400 px on the long side for products (800 px
recommended) and 600 px wide for banners. Every upload is re-encoded to WebP (quality 82), rotated upright, stripped of
EXIF/GPS data and scaled down to 2000 px (products) or 2400 px wide (banners).

### Where files live

`lib/storage.ts` hides storage behind `put / get / delete / exists`. The default `local` driver writes to
`.data/uploads/` (git-ignored; override with `UPLOAD_DIR`) under random names like `products/<uuid>.webp`. They are
served by `app/media/[...path]/route.ts` at `/media/<key>` with a one-year immutable cache, and `next/image` optimizes
them for each card (`images.localPatterns` in `next.config.ts`). Back up `.data/uploads` with the database. Choose the
driver with `STORAGE_DRIVER` (only `local` exists); the top of `lib/storage.ts` explains how to add S3, R2 or Vercel Blob.

When a photo is removed from a product or banner (or the product or banner is deleted), its file is deleted after the
change is saved, unless something else still uses it. A file that was uploaded but never saved stays on disk until
someone removes it.

## Demo files (public/images)

## Use only images you have the right to use

Take your own photos, buy or licence them, or use a source whose licence allows commercial use
(for example Unsplash or Pexels). Do not copy product images from other shops: they are
copyrighted, and "educational use" is not a licence. Keep a note of the source and licence
for each file.

## Where files go

| Purpose | Path | Notes |
|---|---|---|
| Product, main image | `public/images/products/<slug>.webp` | Square, neutral background |
| Product, extra views | `public/images/products/<slug>-2.webp` to `-6.webp` | Shown in the gallery and as hover image |
| Category tile | `public/images/categories/<slug>.webp` | Square, clear subject |
| Hero slide artwork | `public/images/campaigns/<slide-id>.webp` | Transparent or plain background works best |

`<slug>` is the product's `slug` in `features/catalog/demo.ts` (for example `air-fryer-5-5l`).
Category slugs and hero slide ids are in the same data files. Accepted formats: `.webp`, `.avif`,
`.jpg`, `.jpeg`, `.png`.

## Suggested sizes

- Product master: 1200 to 1600 px square. Next.js makes the small versions for cards.
- Category tile: 480 x 480 px.
- Hero artwork: about 1200 x 900 px.
- Aim for roughly 100 to 250 KB per file after export.

## After adding demo images

```bash
pnpm images
pnpm db:seed   # registers the product photos in the product_images table (resets dev data)
```

`pnpm images` rewrites `features/catalog/image-manifest.json` and prints what is still missing. Commit the images and the
manifest together. `pnpm db:seed` copies the manifest's product photos into `product_images`, so they show up (and can be
reordered) in the admin. Category and campaign images still come only from the manifest.

## How the storefront picks a photo

### Reference products for empty categories

`node scripts/add-category-products.mjs` adds the sports, books and automotive entries listed in
`scripts/data/category-products.json`. Run `pnpm images` first. The import is additive and safe to rerun:
existing products and inventory are left unchanged. New entries are published with zero stock, real WebP
photos and reference prices (not a live Amazon price feed). Price source links are recorded in the data
file and audit log. After a destructive development reseed, rerun this import to restore these entries.
Allow the storefront catalog cache to refresh, or restart the development server after a CLI import.

Product photos: the product's own `images` (from the database, loaded with the product) > the manifest files for its slug >
the icon placeholder (`features/catalog/images.ts`, used by `ProductArt`, the card, the gallery, cart, checkout and
compare). Alt text is the description staff wrote, or the product title.
