# Product, category and hero images

The store ships with icon placeholders. Real photos are optional: add a file, run one command,
and every card, gallery, cart row and tile picks it up. A missing photo never breaks a page.

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

## After adding images

```bash
pnpm images
```

This rewrites `features/catalog/image-manifest.json` and prints which products, categories and
hero slides still have no image. Commit the images and the manifest together.

## How it works

`features/catalog/images.ts` reads the manifest. `ProductArt` and `CategoryArt` show the photo when
one exists and the icon placeholder when it does not, in server and client components alike.
