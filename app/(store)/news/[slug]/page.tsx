import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArticleView } from "@/components/articles/article-view"
import { JsonLd } from "@/components/json-ld"
import { getArticle, getPublishedArticles } from "@/features/articles/data"
import { getProductsByIds } from "@/features/catalog/data"
import { absoluteUrl, SITE_NAME } from "@/lib/site"

// Allowed to block so an unknown or unpublished slug returns a real 404 instead of a streamed 200.
export const instant = false

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const a = await getArticle((await params).slug)
  if (!a) return { title: "Article", robots: { index: false } }
  return { title: a.seoTitle || a.title, description: a.seoDescription || a.excerpt, alternates: { canonical: `/news/${a.slug}` }, openGraph: { type: "article", title: a.title, description: a.excerpt, publishedTime: a.publishedAt, modifiedTime: a.updatedAt, authors: [a.author] } }
}

export default async function ArticlePage({ params }: PageProps<"/news/[slug]">) {
  const article = await getArticle((await params).slug)
  if (!article) notFound()
  const [all, found] = await Promise.all([getPublishedArticles(), article.productIds.length ? getProductsByIds(article.productIds) : Promise.resolve([])])
  const products = article.productIds.flatMap((id) => found.find((p) => p.id === id) ?? []) // keep the order the editor chose
  const related = all.filter((a) => a.id !== article.id && (a.category === article.category || a.productIds.some((id) => article.productIds.includes(id)))).slice(0, 3)
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: article.title, description: article.excerpt, datePublished: article.publishedAt, dateModified: article.updatedAt, author: { "@type": "Organization", name: article.author }, publisher: { "@type": "Organization", name: SITE_NAME }, mainEntityOfPage: absoluteUrl(`/news/${article.slug}`) }} />
      <ArticleView article={article} products={products} related={related} />
    </>
  )
}
