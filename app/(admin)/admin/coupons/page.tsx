import { Authorized } from "@/components/admin/authorized"
import { CouponsView } from "@/components/admin/coupons-view"

export default function Page() {
  return <Authorized section="/admin/coupons"><CouponsView /></Authorized>
}
