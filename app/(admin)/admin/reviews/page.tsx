import { Authorized } from "@/components/admin/authorized"
import { ReviewsView } from "@/components/admin/reviews-view"

export default function Page() {
  return <Authorized section="/admin/reviews"><ReviewsView /></Authorized>
}
