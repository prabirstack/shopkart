import { Authorized } from "@/components/admin/authorized"
import { ReportsView } from "@/components/admin/reports-view"

export default function Page() {
  return <Authorized section="/admin/reports"><ReportsView /></Authorized>
}
