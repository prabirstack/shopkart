import type { Metadata } from "next"
import { ProductListPage } from "@/components/info/product-list-page"
import { getNewArrivals } from "@/features/catalog/data"
import { MENU_LIMIT } from "@/features/catalog/menu"

export const metadata: Metadata = { title: "New arrivals", description: "The latest products added to ShopKart: gadgets, home, beauty, toys and more.", alternates: { canonical: "/new-arrivals" } }

export default async function NewArrivalsPage() {
  return <ProductListPage title="New arrivals" intro="Fresh products added to the store this month." products={await getNewArrivals(MENU_LIMIT)} />
}
