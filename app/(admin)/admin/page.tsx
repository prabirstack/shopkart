import { Authorized } from "@/components/admin/authorized"
import { DashboardView } from "@/components/admin/dashboard-view"

export default function Page() {
  return <Authorized section="/admin"><DashboardView /></Authorized>
}
