import { Suspense } from "react"
import { ARTICLE_CATEGORIES, type Article, type ArticleCategory } from "@/features/articles/types"
import type { Metadata } from "next"
import { ArticleList } from "@/components/articles/article-list"
import { PageBanner } from "@/components/store/page-banner"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { getPublishedArticles } from "@/features/articles/data"

export const metadata: Metadata = { title: "Buying guides, reviews and comparisons", description: "Plain-English buying guides, product reviews and side-by-side comparisons to help you choose the right product.", alternates: { canonical: "/news" } }

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ category?: string | string[] }> }) {
  const articles = await getPublishedArticles()
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-5 py-6">
      <StoreBreadcrumbs trail={[{ label: "Articles" }]} />
      <PageBanner title="Guides, reviews & comparisons" intro="Honest buying advice so you pick the right product the first time." />
      <Suspense fallback={<p className="py-8 text-muted-foreground">Loading articles…</p>}><FilteredArticles articles={articles} searchParams={searchParams} /></Suspense>
    </main>
  )
}

async function FilteredArticles({ articles, searchParams }: { articles: Article[]; searchParams: Promise<{ category?: string | string[] }> }) {
  const { category } = await searchParams
  const selected = typeof category === "string" && ARTICLE_CATEGORIES.includes(category as ArticleCategory) ? category as ArticleCategory : "all"
  return <ArticleList articles={articles} category={selected} />
}
