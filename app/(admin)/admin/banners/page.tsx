import { Authorized } from "@/components/admin/authorized"
import { BannersView } from "@/components/admin/banners-view"

export default function Page() {
  return <Authorized section="/admin/banners"><BannersView /></Authorized>
}
