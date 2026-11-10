import { Authorized } from "@/components/admin/authorized"
import { ArticleForm } from "@/components/admin/article-form"

export default function NewArticlePage() {
  return <Authorized section="/admin/articles"><ArticleForm /></Authorized>
}
