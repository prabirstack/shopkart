import { Authorized } from "@/components/admin/authorized"
import { SettingsView } from "@/components/admin/settings-view"

export default function Page() {
  return <Authorized section="/admin/settings"><SettingsView /></Authorized>
}
