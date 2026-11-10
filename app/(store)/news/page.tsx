import type { Metadata } from "next"
import { ArticleList } from "@/components/articles/article-list"
import { PageBanner } from "@/components/store/page-banner"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { getPublishedArticles } from "@/features/articles/data"

export const metadata: Metadata = { title: "Buying guides, reviews and comparisons", description: "Plain-English buying guides, product reviews and side-by-side comparisons to help you choose the right product.", alternates: { canonical: "/news" } }

export default async function NewsPage() {
  const articles = await getPublishedArticles()
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-5 py-6">
      <StoreBreadcrumbs trail={[{ label: "Articles" }]} />
      <PageBanner title="Guides, reviews & comparisons" intro="Honest buying advice so you pick the right product the first time." />
      <ArticleList articles={articles} />
    </main>
  )
}
