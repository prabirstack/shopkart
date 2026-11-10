import { CartView } from "@/features/cart/cart-view"
import { getTopSelling } from "@/features/catalog/data"

export default async function CartPage() {
  return <CartView recommended={await getTopSelling(8)} />
}
