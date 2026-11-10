import type { Metadata } from "next"
import { JsonLd } from "@/components/json-ld"
import { StorefrontHome } from "@/components/store/storefront-home"
import { organizationLd, websiteLd } from "@/features/seo/structured-data"

export const metadata: Metadata = { title: { absolute: "ShopKart - Online Shopping for Electronics, Fashion, Home & More" }, alternates: { canonical: "/" } }

export default function HomePage() {
  return (
    <>
      <JsonLd data={[organizationLd, websiteLd]} />
      <StorefrontHome />
    </>
  )
}
