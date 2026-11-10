import { notFound, redirect } from "next/navigation"
import { categories } from "@/features/catalog/demo"

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }))
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params
  if (!categories.some((c) => c.slug === slug)) notFound()
  redirect(`/products?category=${slug}`)
}
