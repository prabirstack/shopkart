import Link from "next/link"
import { ArrowUpRight, Clock3 } from "lucide-react"
import type { Article } from "@/features/articles/types"
import { readMinutes } from "@/features/articles/render"
import { ArticleCover, formatArticleDate } from "./article-card"

/** A lead story and a compact news list, using only published articles supplied by the caller. */
export function EditorialStories({ articles }: { articles: Article[] }) {
  const [lead, ...rest] = articles
  if (!lead) return null
  return (
    <div className={`grid self-stretch gap-7 ${rest.length ? "lg:grid-cols-[1.15fr_1fr] lg:gap-8" : ""}`}>
      <article className="min-w-0">
        <Link href={`/news/${lead.slug}`} className="editorial-story group/art block focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-primary">
          <div className="relative"><ArticleCover slug={lead.slug} category={lead.category} className="aspect-[16/9] rounded-xl" sizes="(min-width: 1024px) 50vw, 100vw" />
            <span className="absolute bottom-3 left-3 rounded-sm bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-900">Latest story</span>
          </div>
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{lead.category}</p>
          <h3 className="mt-2 font-serif text-2xl font-semibold leading-[1.15] tracking-tight transition-colors group-hover/art:text-primary sm:text-3xl">{lead.title}</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{lead.excerpt}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground"><span>{formatArticleDate(lead.publishedAt)}</span><span className="inline-flex items-center gap-1"><Clock3 className="size-3" aria-hidden="true" />{readMinutes(lead.doc)} min read</span><span className="ml-auto inline-flex items-center gap-1 font-semibold text-foreground">Read story <ArrowUpRight className="size-3.5" aria-hidden="true" /></span></p>
        </Link>
      </article>
      {rest.length > 0 && <div className="min-w-0 lg:border-l lg:pl-8">
        <p className="mb-1 border-b border-foreground pb-3 text-[10px] font-bold uppercase tracking-[0.2em]">More from the journal</p>
        <ul className="divide-y">{rest.map(article => <li key={article.id}>
          <Link href={`/news/${article.slug}`} className="editorial-story group/art grid grid-cols-[minmax(0,1fr)_6.5rem] items-center gap-4 py-5 focus-visible:outline-2 focus-visible:outline-primary sm:grid-cols-[minmax(0,1fr)_8rem]">
            <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">{article.category}</p><h3 className="mt-1.5 text-sm font-semibold leading-snug transition-colors group-hover/art:text-primary sm:text-base">{article.title}</h3><p className="mt-2 text-[10px] text-muted-foreground">{formatArticleDate(article.publishedAt)} <span aria-hidden="true">·</span> {readMinutes(article.doc)} min read</p></div>
            <ArticleCover slug={article.slug} category={article.category} className="aspect-[4/3] rounded-lg" sizes="128px" />
          </Link>
        </li>)}</ul>
      </div>}
    </div>
  )
}
