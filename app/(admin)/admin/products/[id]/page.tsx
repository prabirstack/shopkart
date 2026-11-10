import { Authorized } from "@/components/admin/authorized"
import { ProductForm } from "@/components/admin/product-form"
import { loadAdminProduct, loadAdminRefs } from "@/lib/db/queries"

// Products are created at runtime, so the editor looks the ID up instead of prerendering.
export const instant = false

async function Data({ id }: { id: string }) {
  const [product, refs] = await Promise.all([loadAdminProduct(id), loadAdminRefs()])
  return <ProductForm product={product} refs={refs} />
}

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params
  return <Authorized section="/admin/products"><Data id={id} /></Authorized>
}
