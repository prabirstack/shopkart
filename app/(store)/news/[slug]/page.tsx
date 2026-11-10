import type { Metadata } from "next"
import { ArticleView } from "@/components/articles/article-view"
import { JsonLd } from "@/components/json-ld"
import { publishedSeed, seedBySlug } from "@/features/articles/seed"
import { absoluteUrl, SITE_NAME } from "@/lib/site"

// Articles created in the admin only exist in the browser, so unknown slugs are resolved on the client.
export const instant = false

export function generateStaticParams() {
  return publishedSeed.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: PageProps<"/news/[slug]">): Promise<Metadata> {
  const a = seedBySlug((await params).slug)
  if (!a || a.status !== "published") return { title: "Article", robots: { index: false } }
  return { title: a.seoTitle || a.title, description: a.seoDescription || a.excerpt, alternates: { canonical: `/news/${a.slug}` }, openGraph: { type: "article", title: a.title, description: a.excerpt, publishedTime: a.publishedAt, modifiedTime: a.updatedAt, authors: [a.author] } }
}

export default async function ArticlePage({ params }: PageProps<"/news/[slug]">) {
  const { slug } = await params
  const a = seedBySlug(slug)
  const initial = a && a.status === "published" ? a : null
  return (
    <>
      {initial && <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: initial.title, description: initial.excerpt, datePublished: initial.publishedAt, dateModified: initial.updatedAt, author: { "@type": "Organization", name: initial.author }, publisher: { "@type": "Organization", name: SITE_NAME }, mainEntityOfPage: absoluteUrl(`/news/${initial.slug}`) }} />}
      <ArticleView slug={slug} initial={initial} />
    </>
  )
}
