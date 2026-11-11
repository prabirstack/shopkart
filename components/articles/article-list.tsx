"use client"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { SectionHeader } from "@/components/store/section-header"
import { type Article, type ArticleCategory } from "@/features/articles/types"
import { ArticleCard } from "./article-card"
import { EditorialStories } from "./editorial-stories"
import { ArticleCategorySidebar } from "./article-category-sidebar"

/** Full listing with category filters. Receives the published articles from the server. */
export function ArticleList({ articles: all, category = "all" }: { articles: Article[]; category?: "all" | ArticleCategory }) {
  const list = all.filter((a) => category === "all" || a.category === category)
  return (
    <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <div className="min-w-0 space-y-7">
        {list.length === 0 ? <p className="rounded-xl border bg-card p-10 text-center text-muted-foreground">No articles in this category yet.</p> : (
          <>
            <EditorialStories articles={list.slice(0, 5)} />
            {list.length > 5 && <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.slice(5).map((a) => <li key={a.id}><ArticleCard article={a} /></li>)}</ul>}
          </>
        )}
      </div>
      <ArticleCategorySidebar articles={all} selected={category} />
    </div>
  )
}

/** Compact strip for the homepage. */
export function LatestGuides({ initial, limit = 5 }: { /** The published articles, newest first. */ initial: Article[]; limit?: number }) {
  const list = initial.slice(0, limit)
  if (!list.length) return null
  return (
    <section aria-labelledby="guides-heading" className="border-t-2 border-foreground pt-5">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">The ShopKart Journal</p>
      <SectionHeader id="guides-heading" title="Buying guides & reviews" href="/news" linkLabel="Explore the journal" />
      <div className="mt-5 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_13rem]"><EditorialStories articles={list} /><ArticleCategorySidebar articles={initial} /></div>
    </section>
  )
}

/** Articles that feature a product, for the product page. Renders nothing when there are none. */
export function RelatedArticles({ productId, articles }: { productId: string; articles: Article[] }) {
  const list = articles.filter((a) => a.productIds.includes(productId)).slice(0, 3)
  if (list.length === 0) return null
  return (
    <section aria-labelledby="rel-articles">
      <SectionHeader id="rel-articles" title="Guides & reviews featuring this product" />
      <ul className="grid gap-4 md:grid-cols-3">{list.map((a) => <li key={a.id}><ArticleCard article={a} /></li>)}</ul>
      <p className="mt-3 text-sm"><Link href="/news" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Browse all articles <ArrowRight className="size-4" aria-hidden="true" /></Link></p>
    </section>
  )
}
