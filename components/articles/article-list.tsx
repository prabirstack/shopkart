"use client"
import Link from "next/link"
import { useState } from "react"
import { ArrowRight } from "lucide-react"
import { SectionHeader } from "@/components/store/section-header"
import { usePublishedArticles } from "@/features/articles/store"
import { ARTICLE_CATEGORIES, type Article, type ArticleCategory } from "@/features/articles/types"
import { ArticleCard } from "./article-card"

/** Full listing with category filters. `initial` is the server-rendered list shown before saved data loads. */
export function ArticleList({ initial }: { initial: Article[] }) {
  const all = usePublishedArticles(initial)
  const [category, setCategory] = useState<"all" | ArticleCategory>("all")
  const list = all.filter((a) => category === "all" || a.category === category)
  const [first, ...rest] = list
  return (
    <div className="grid gap-6">
      <div role="group" aria-label="Filter by type" className="flex flex-wrap gap-2 text-sm">
        {(["all", ...ARTICLE_CATEGORIES] as const).map((c) => (
          <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}
            className={`rounded-full border px-4 py-1.5 font-medium transition-colors ${category === c ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {c === "all" ? "All" : c}<span className="ml-1.5 text-xs opacity-70">{c === "all" ? all.length : all.filter((a) => a.category === c).length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? <p className="rounded-xl border bg-card p-10 text-center text-muted-foreground">No articles in this category yet.</p> : (
        <>
          <ArticleCard article={first} featured />
          {rest.length > 0 && <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{rest.map((a) => <li key={a.id}><ArticleCard article={a} /></li>)}</ul>}
        </>
      )}
    </div>
  )
}

/** Compact strip for the homepage. */
export function LatestGuides({ initial, limit = 3 }: { initial: Article[]; limit?: number }) {
  const list = usePublishedArticles(initial).slice(0, limit)
  return (
    <section aria-labelledby="guides-heading">
      <SectionHeader id="guides-heading" title="Buying guides & reviews" href="/news" linkLabel="All articles" />
      <ul className="grid gap-4 md:grid-cols-3">{list.map((a) => <li key={a.id}><ArticleCard article={a} /></li>)}</ul>
    </section>
  )
}

/** Articles that feature a product, for the product page. Renders nothing when there are none. */
export function RelatedArticles({ productId, initial }: { productId: string; initial: Article[] }) {
  const list = usePublishedArticles(initial).filter((a) => a.productIds.includes(productId)).slice(0, 3)
  if (list.length === 0) return null
  return (
    <section aria-labelledby="rel-articles">
      <SectionHeader id="rel-articles" title="Guides & reviews featuring this product" />
      <ul className="grid gap-4 md:grid-cols-3">{list.map((a) => <li key={a.id}><ArticleCard article={a} /></li>)}</ul>
      <p className="mt-3 text-sm"><Link href="/news" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Browse all articles <ArrowRight className="size-4" aria-hidden="true" /></Link></p>
    </section>
  )
}
