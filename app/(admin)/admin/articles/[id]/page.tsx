import { ArticleForm } from "@/components/admin/article-form"

// Articles can be created at runtime, so the editor looks the ID up instead of prerendering.
export const instant = false

export default async function EditArticlePage({ params }: PageProps<"/admin/articles/[id]">) {
  const { id } = await params
  return <ArticleForm id={id} />
}
