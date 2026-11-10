"use client"
import Link from "next/link"
import { Clock, GitCompareArrows, ListTree } from "lucide-react"
import { ProductCard } from "@/components/store/product-card"
import { ShareButtons } from "@/components/store/share-buttons"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { Skeleton } from "@/components/ui/skeleton"
import { buttonVariants } from "@/components/ui/button"
import { RenderDoc, readMinutes, tocOf } from "@/features/articles/render"
import { useArticleStore, useArticlesReady } from "@/features/articles/store"
import type { Article } from "@/features/articles/types"
import { productById } from "@/features/catalog/demo"
import { ArticleCard, ArticleCover, categoryStyle, formatArticleDate } from "./article-card"

/**
 * `initial` is the server-rendered article (good for search engines). After the saved data loads,
 * an edited or newly created version from the admin editor replaces it.
 */
export function ArticleView({ slug, initial }: { slug: string; initial: Article | null }) {
  const ready = useArticlesReady()
  const all = useArticleStore((s) => s.articles)
  const stored = all.find((a) => a.slug === slug)
  const article = ready ? stored : initial ?? undefined

  if (!ready && !initial) return <main className="store-container py-8"><Skeleton className="h-96 rounded-2xl" /></main>
  if (!article || (ready && article.status !== "published")) return (
    <main className="store-container grid place-items-center gap-3 py-20 text-center">
      <h1 className="store-title !text-2xl">This article isn&apos;t available</h1>
      <p className="text-muted-foreground">It may have been unpublished or moved.</p>
      <Link href="/news" className={buttonVariants()}>Browse all articles</Link>
    </main>
  )

  const toc = tocOf(article.doc)
  const products = article.productIds.flatMap((id) => { const p = productById(id); return p ? [p] : [] })
  const related = all.filter((a) => a.status === "published" && a.id !== article.id && (a.category === article.category || a.productIds.some((id) => article.productIds.includes(id)))).slice(0, 3)
  const style = categoryStyle[article.category]

  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-8 py-6">
      <StoreBreadcrumbs trail={[{ label: "Articles", href: "/news" }, { label: article.title }]} />
      <header className="grid max-w-3xl gap-3">
        <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>{article.category}</span>
        <h1 className="store-title">{article.title}</h1>
        <p className="text-lg text-muted-foreground">{article.excerpt}</p>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>By {article.author}</span><span>{formatArticleDate(article.publishedAt)}</span>
          <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden="true" />{readMinutes(article.doc)} min read</span>
          {article.updatedAt !== article.publishedAt && <span>Updated {formatArticleDate(article.updatedAt)}</span>}
        </p>
      </header>
      <ArticleCover category={article.category} className="h-48 rounded-2xl sm:h-64" />
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <article className="min-w-0 max-w-3xl">
          <RenderDoc doc={article.doc} />
          <div className="mt-8 border-t pt-5"><ShareButtons title={article.title} /></div>
        </article>
        <aside className="grid content-start gap-4 lg:sticky lg:top-20">
          {toc.length > 1 && (
            <nav aria-label="In this article" className="rounded-2xl border bg-card p-5 shadow-xs">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><ListTree className="size-4" aria-hidden="true" /> In this article</p>
              <ol className="grid gap-2 text-sm">{toc.map((t) => <li key={t.id} className={t.level === 3 ? "ml-3" : ""}><a href={`#${t.id}`} className="text-muted-foreground hover:text-primary">{t.text}</a></li>)}</ol>
            </nav>
          )}
          {article.compareIds.length >= 2 && (
            <div className="grid gap-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white">
              <GitCompareArrows className="size-7" aria-hidden="true" />
              <p className="font-bold">Compare these products side by side</p>
              <Link href={`/compare?ids=${article.compareIds.join(",")}`} className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-blue-700 hover:bg-white/90">Open comparison</Link>
            </div>
          )}
        </aside>
      </div>
      {products.length > 0 && (
        <section aria-labelledby="feat-products">
          <h2 id="feat-products" className="section-title mb-3">Products in this article</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">{products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}</ul>
        </section>
      )}
      {related.length > 0 && (
        <section aria-labelledby="more-articles"><h2 id="more-articles" className="section-title mb-3">Keep reading</h2><ul className="grid gap-4 md:grid-cols-3">{related.map((a) => <li key={a.id}><ArticleCard article={a} /></li>)}</ul></section>
      )}
    </main>
  )
}
