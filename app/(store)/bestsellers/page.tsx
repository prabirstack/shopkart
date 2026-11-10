import type { Metadata } from "next"
import { ProductListPage } from "@/components/info/product-list-page"
import { getBestsellers } from "@/features/catalog/data"
import { MENU_LIMIT } from "@/features/catalog/menu"

export const metadata: Metadata = { title: "Bestsellers", description: "The products our customers rate and buy most on ShopKart.", alternates: { canonical: "/bestsellers" } }

export default async function BestsellersPage() {
  return <ProductListPage title="Bestsellers" intro="Highly rated products that shoppers keep coming back for." products={await getBestsellers(MENU_LIMIT)} moreHref="/products?sort=rating" moreLabel="See everything by rating" />
}
