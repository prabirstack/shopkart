import { notFound, redirect } from "next/navigation"
import { getCategories } from "@/features/catalog/data"

export const instant = false

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }))
}

export default async function CategoryPage({ params }: PageProps<"/categories/[slug]">) {
  const { slug } = await params
  if (!(await getCategories()).some((c) => c.slug === slug)) notFound()
  redirect(`/products?category=${slug}`)
}
