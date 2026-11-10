import { ImageResponse } from "next/og"
import { catalog, productBySlug } from "@/features/catalog/demo"
import { formatMoney } from "@/lib/money"

/**
 * Stable image URL (/og/product/<slug>) used by both Open Graph tags and JSON-LD.
 * File-based opengraph-image routes get a hashed URL we can't reference elsewhere.
 */
export function generateStaticParams() { return catalog.map((p) => ({ slug: p.slug })) }

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const p = productBySlug((await params).slug)
  if (!p) return new Response("Not found", { status: 404 })
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#f5f5f5", color: "#111827" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34 }}><span style={{ fontWeight: 800, color: "#c51632" }}>ShopKart</span><span>{p.brand}</span></div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.08 }}>{p.title}</div>
        <div style={{ fontSize: 60, fontWeight: 800, color: "#c51632", marginTop: 24 }}>{formatMoney(p.pricePaise, undefined, undefined, { hideZeroDecimals: true })}</div>
      </div>
      <div style={{ fontSize: 30, opacity: 0.7 }}>Free delivery above ₹699 · 7-day returns</div>
    </div>,
    { width: 1200, height: 630 },
  )
}
