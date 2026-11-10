import { Authorized } from "@/components/admin/authorized"
import { ArticlesView } from "@/components/admin/articles-view"
import { loadAdminArticles } from "@/lib/db/queries"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  return <ArticlesView articles={await loadAdminArticles()} />
}

export default function Page() {
  return <Authorized section="/admin/articles"><Data /></Authorized>
}
