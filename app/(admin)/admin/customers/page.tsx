import { Authorized } from "@/components/admin/authorized"
import { CustomersView } from "@/components/admin/customers-view"

export default function Page() {
  return <Authorized section="/admin/customers"><CustomersView /></Authorized>
}
