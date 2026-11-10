import { Authorized } from "@/components/admin/authorized"
import { ProductForm } from "@/components/admin/product-form"

// Products can be created at runtime, so the editor looks the ID up instead of prerendering.
export const instant = false

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params
  return <Authorized section="/admin/products"><ProductForm id={id} /></Authorized>
}
