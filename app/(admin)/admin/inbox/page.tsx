import { Authorized } from "@/components/admin/authorized"
import { InboxView } from "@/components/admin/inbox-view"
import { loadAdminMessages, loadAdminSubscribers } from "@/lib/db/queries"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  const [messages, subscribers] = await Promise.all([loadAdminMessages(), loadAdminSubscribers()])
  return <InboxView messages={messages} subscribers={subscribers} />
}

export default function Page() {
  return <Authorized section="/admin/inbox"><Data /></Authorized>
}
