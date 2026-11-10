import { Authorized } from "@/components/admin/authorized"
import { ProductForm } from "@/components/admin/product-form"

export default function NewProductPage() {
  return <Authorized section="/admin/products"><ProductForm /></Authorized>
}
