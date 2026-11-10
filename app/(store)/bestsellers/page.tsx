import type { Metadata } from "next"
import { ProductListPage } from "@/components/info/product-list-page"
import { bestsellers } from "@/features/catalog/demo"

export const metadata: Metadata = { title: "Bestsellers", description: "The products our customers rate and buy most on ShopKart.", alternates: { canonical: "/bestsellers" } }

export default function BestsellersPage() {
  return <ProductListPage title="Bestsellers" intro="Highly rated products that shoppers keep coming back for." products={bestsellers} moreHref="/products?sort=rating" moreLabel="See everything by rating" />
}
