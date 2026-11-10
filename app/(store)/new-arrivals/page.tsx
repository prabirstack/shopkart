import type { Metadata } from "next"
import { ProductListPage } from "@/components/info/product-list-page"
import { newArrivals } from "@/features/catalog/demo"

export const metadata: Metadata = { title: "New arrivals", description: "The latest products added to ShopKart: gadgets, home, beauty, toys and more.", alternates: { canonical: "/new-arrivals" } }

export default function NewArrivalsPage() {
  return <ProductListPage title="New arrivals" intro="Fresh products added to the store this month." products={newArrivals} />
}
