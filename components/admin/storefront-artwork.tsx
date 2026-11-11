import Image from "next/image"
import manifest from "@/features/catalog/image-manifest.json"

const label = (id: string) => id.replace(/^promo-/, "").replace(/^collection-/, "").replaceAll("-", " ")

/** Uses the same manifest as the storefront so previews never become a separate image catalogue. */
export function StorefrontArtwork() {
  return (
    <details className="rounded-2xl border bg-card p-5 shadow-xs">
      <summary className="cursor-pointer font-semibold">Storefront artwork · banners and categories</summary>
      <p className="mt-3 text-sm text-muted-foreground">Current storefront artwork. Download a banner to use it when scheduling a campaign above.</p>
      <h2 className="mb-3 mt-5 text-sm font-semibold">Campaign artwork</h2>
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Object.entries(manifest.campaigns).map(([id, url]) => (
          <li key={id} className="overflow-hidden rounded-xl border">
            <div className="relative aspect-[3/1] bg-muted"><Image src={url} alt={`${label(id)} campaign artwork`} fill sizes="(max-width: 640px) 90vw, 400px" className="object-cover" /></div>
            <div className="flex items-center justify-between gap-2 p-3 text-sm"><span className="capitalize">{label(id)}</span><a href={url} download className="font-medium text-primary hover:underline">Download WebP</a></div>
          </li>
        ))}
      </ul>
      <h2 className="mb-3 mt-6 text-sm font-semibold">Category artwork</h2>
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {Object.entries(manifest.categories).map(([id, url]) => (
          <li key={id} className="rounded-xl bg-muted/50 p-3 text-center text-xs">
            <div className="relative mx-auto mb-2 size-20"><Image src={url} alt="" fill sizes="80px" className="object-contain" /></div>
            <span className="capitalize">{label(id)}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
