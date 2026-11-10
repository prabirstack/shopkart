import { ImageResponse } from "next/og"
import { SITE_NAME } from "@/lib/site"

export const alt = "ShopKart: great products, best prices"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#111827,#7f1020 60%,#c51632)", color: "white" }}>
      <div style={{ fontSize: 40, opacity: 0.8 }}>{SITE_NAME}</div>
      <div style={{ fontSize: 88, fontWeight: 800, marginTop: 16, lineHeight: 1.05 }}>Great products. Best prices.</div>
      <div style={{ fontSize: 34, marginTop: 28, opacity: 0.85 }}>Free delivery above ₹699 · Easy 7-day returns</div>
    </div>,
    size,
  )
}
