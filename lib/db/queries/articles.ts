import "server-only"

import { and, asc, desc, eq } from "drizzle-orm"

import { db } from "../index"
import { articleProducts, articles, type ArticleDoc } from "../schema"
import type { ArticleDTO } from "./types"

type Row = typeof articles.$inferSelect

async function withProducts(rows: Row[]): Promise<ArticleDTO[]> {
  if (rows.length === 0) return []
  const links = await db.select().from(articleProducts).orderBy(asc(articleProducts.position))
  return rows.map((r) => ({
    id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, category: r.category, authorName: r.authorName, status: r.status, publishedAt: r.publishedAt, updatedAt: r.updatedAt,
    doc: r.doc, seoTitle: r.seoTitle, seoDescription: r.seoDescription,
    featuredProductIds: links.filter((l) => l.articleId === r.id && l.kind === "featured").map((l) => l.productId),
    compareProductIds: links.filter((l) => l.articleId === r.id && l.kind === "compare").map((l) => l.productId),
  }))
}

export async function listPublishedArticles(): Promise<ArticleDTO[]> {
  return withProducts(await db.select().from(articles).where(eq(articles.status, "published")).orderBy(desc(articles.publishedAt)))
}

/** Public lookup: drafts are never returned. */
export async function getPublishedArticle(slug: string): Promise<ArticleDTO | null> {
  return (await withProducts(await db.select().from(articles).where(and(eq(articles.slug, slug), eq(articles.status, "published"))).limit(1)))[0] ?? null
}

export async function listArticlesForAdmin(): Promise<ArticleDTO[]> {
  return withProducts(await db.select().from(articles).orderBy(desc(articles.updatedAt)))
}

export type SaveArticleInput = {
  id?: string; slug: string; title: string; excerpt: string; category: ArticleDTO["category"]; authorName: string; status: "draft" | "published"
  doc: ArticleDoc; seoTitle: string; seoDescription: string; featuredProductIds: string[]; compareProductIds: string[]
}

/** Creates or updates an article and its product links together. Publishing sets the publish date once. */
export async function saveArticle(input: SaveArticleInput): Promise<string> {
  return db.transaction(async (tx) => {
    const values = { slug: input.slug, title: input.title, excerpt: input.excerpt, category: input.category, authorName: input.authorName, status: input.status, doc: input.doc, seoTitle: input.seoTitle, seoDescription: input.seoDescription }
    let articleId = input.id
    if (articleId) {
      const [existing] = await tx.select({ publishedAt: articles.publishedAt }).from(articles).where(eq(articles.id, articleId)).for("update")
      await tx.update(articles).set({ ...values, publishedAt: input.status === "published" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null) }).where(eq(articles.id, articleId))
      await tx.delete(articleProducts).where(eq(articleProducts.articleId, articleId))
    } else {
      const [row] = await tx.insert(articles).values({ ...values, publishedAt: input.status === "published" ? new Date() : null }).returning({ id: articles.id })
      articleId = row.id
    }
    const links = [...input.featuredProductIds.map((productId, position) => ({ articleId: articleId!, productId, kind: "featured" as const, position })), ...input.compareProductIds.map((productId, position) => ({ articleId: articleId!, productId, kind: "compare" as const, position }))]
    if (links.length) await tx.insert(articleProducts).values(links)
    return articleId
  })
}

export async function setArticleStatus(id: string, status: "draft" | "published") {
  await db.update(articles).set({ status, publishedAt: status === "published" ? new Date() : null }).where(eq(articles.id, id))
}
