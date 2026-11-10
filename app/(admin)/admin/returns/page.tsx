import { Authorized } from "@/components/admin/authorized"
import { ReturnsView } from "@/components/admin/returns-view"

export default function Page() {
  return <Authorized section="/admin/returns"><ReturnsView /></Authorized>
}
