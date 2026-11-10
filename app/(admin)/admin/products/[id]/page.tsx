import { ProductForm } from "@/components/admin/product-form"

// Products can be created at runtime, so the editor looks the ID up in the store instead of prerendering.
export const instant = false

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params
  return <ProductForm id={id} />
}
