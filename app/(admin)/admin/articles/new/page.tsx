import { Authorized } from "@/components/admin/authorized"
import { ArticleForm } from "@/components/admin/article-form"
import { loadAdminProductChoices } from "@/lib/db/queries"

// Every admin page is personal (it reads the session and the database on each request), so there is nothing to
// prerender: allow a blocking route instead of a static shell.
export const instant = false

async function Data() {
  return <ArticleForm products={await loadAdminProductChoices()} />
}

export default function NewArticlePage() {
  return <Authorized section="/admin/articles"><Data /></Authorized>
}
