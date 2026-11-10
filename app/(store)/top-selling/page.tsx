import type { Metadata } from "next"
import { ProductListPage } from "@/components/info/product-list-page"
import { getTopSelling } from "@/features/catalog/data"

export const metadata: Metadata = { title: "Top selling products", description: "ShopKart's top selling products across every category.", alternates: { canonical: "/top-selling" } }

export default async function TopSellingPage() {
  return <ProductListPage title="Top selling products" intro="What most people are buying right now." products={await getTopSelling(10)} moreHref="/products?sort=popular" moreLabel="See most popular in the shop" />
}
