import { Authorized } from "@/components/admin/authorized"
import { SettingsView } from "@/components/admin/settings-view"
import { loadAdminSettings } from "@/lib/db/queries"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  return <SettingsView settings={await loadAdminSettings()} />
}

export default function Page() {
  return <Authorized section="/admin/settings"><Data /></Authorized>
}
