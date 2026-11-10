import { Authorized } from "@/components/admin/authorized"
import { ArticleForm } from "@/components/admin/article-form"
import { loadAdminArticles, loadAdminProductChoices } from "@/lib/db/queries"

// Articles are created at runtime, so the editor looks the ID up instead of prerendering.
export const instant = false

async function Data({ id }: { id: string }) {
  const [articles, products] = await Promise.all([loadAdminArticles(), loadAdminProductChoices()])
  return <ArticleForm article={articles.find((a) => a.id === id) ?? null} products={products} />
}

export default async function EditArticlePage({ params }: PageProps<"/admin/articles/[id]">) {
  const { id } = await params
  return <Authorized section="/admin/articles"><Data id={id} /></Authorized>
}
