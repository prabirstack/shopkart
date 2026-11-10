import { Authorized } from "@/components/admin/authorized"
import { ArticlesView } from "@/components/admin/articles-view"

export default function Page() {
  return <Authorized section="/admin/articles"><ArticlesView /></Authorized>
}
