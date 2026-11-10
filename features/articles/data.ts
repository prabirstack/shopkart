import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { CACHE_TAGS } from "@/lib/cache"
import { getPublishedArticle, listPublishedArticles, type ArticleDTO } from "@/lib/db/queries"
import type { Article, ArticleCategory } from "./types"

// The storefront's article reads. Only published articles come through here (the queries filter drafts out),
// and the cache is refreshed whenever the admin saves, publishes or deletes an article.

const CATEGORY_LABEL: Record<ArticleDTO["category"], ArticleCategory> = { buying_guide: "Buying guide", product_review: "Product review", comparison: "Comparison", news: "News" }
const day = (d: Date) => d.toISOString().slice(0, 10)

function toArticle(a: ArticleDTO): Article {
  return {
    id: a.id, slug: a.slug, title: a.title, excerpt: a.excerpt, category: CATEGORY_LABEL[a.category], author: a.authorName,
    publishedAt: day(a.publishedAt ?? a.updatedAt), updatedAt: day(a.updatedAt), status: "published",
    productIds: a.featuredProductIds, compareIds: a.compareProductIds, seoTitle: a.seoTitle, seoDescription: a.seoDescription, doc: a.doc as Article["doc"],
  }
}

const tag = () => { cacheLife("minutes"); cacheTag(CACHE_TAGS.content) }

/** Published articles, newest first. */
export async function getPublishedArticles(): Promise<Article[]> {
  "use cache"
  tag()
  return (await listPublishedArticles()).map(toArticle)
}

/** One published article, or null (drafts and unknown slugs both give null). */
export async function getArticle(slug: string): Promise<Article | null> {
  "use cache"
  tag()
  const a = await getPublishedArticle(slug)
  return a ? toArticle(a) : null
}
