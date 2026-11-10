import Link from "next/link"
import { BookOpen, Newspaper, Scale, Star, type LucideIcon } from "lucide-react"
import { readMinutes } from "@/features/articles/render"
import type { Article, ArticleCategory } from "@/features/articles/types"

export const categoryStyle: Record<ArticleCategory, { icon: LucideIcon; cover: string; badge: string }> = {
  "Buying guide": { icon: BookOpen, cover: "from-emerald-500 via-teal-600 to-cyan-700", badge: "bg-emerald-100 text-emerald-800" },
  "Product review": { icon: Star, cover: "from-violet-500 via-purple-600 to-fuchsia-700", badge: "bg-violet-100 text-violet-800" },
  Comparison: { icon: Scale, cover: "from-blue-500 via-indigo-600 to-violet-700", badge: "bg-blue-100 text-blue-800" },
  News: { icon: Newspaper, cover: "from-amber-500 via-orange-600 to-red-700", badge: "bg-amber-100 text-amber-900" },
}

const date = (iso: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`))
export const formatArticleDate = date

export function ArticleCover({ category, className = "" }: { category: ArticleCategory; className?: string }) {
  const { icon: Icon, cover } = categoryStyle[category]
  return (
    <span aria-hidden="true" className={`relative grid place-items-center overflow-hidden bg-gradient-to-br text-white ${cover} ${className}`}>
      <span className="absolute -right-8 -top-8 size-40 rounded-full bg-white/10" />
      <span className="absolute -bottom-10 -left-6 size-32 rounded-full bg-white/10" />
      <Icon className="relative size-14 opacity-90 transition-transform duration-500 group-hover/art:scale-110 group-hover/art:-rotate-3" strokeWidth={1.2} />
    </span>
  )
}

export function ArticleCard({ article, featured = false }: { article: Article; featured?: boolean }) {
  const mins = readMinutes(article.doc)
  return (
    <Link href={`/news/${article.slug}`} className={`group/art flex h-full overflow-hidden rounded-2xl border bg-card shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 ${featured ? "flex-col md:flex-row" : "flex-col"}`}>
      <ArticleCover category={article.category} className={featured ? "h-48 md:h-auto md:w-[45%]" : "h-40"} />
      <span className="flex flex-1 flex-col gap-2 p-5">
        <span className={`w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryStyle[article.category].badge}`}>{article.category}</span>
        <span className={`font-bold leading-snug transition-colors group-hover/art:text-primary ${featured ? "text-2xl" : "text-lg"}`}>{article.title}</span>
        <span className="line-clamp-3 flex-1 text-sm text-muted-foreground">{article.excerpt}</span>
        <span className="text-xs text-muted-foreground">{date(article.publishedAt)} · {mins} min read</span>
      </span>
    </Link>
  )
}
