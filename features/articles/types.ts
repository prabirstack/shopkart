/** A ProseMirror/TipTap document node. Articles are stored as this JSON, never as raw HTML. */
export type DocMark = { type: string; attrs?: Record<string, unknown> }
export type DocNode = { type: string; attrs?: Record<string, unknown>; content?: DocNode[]; marks?: DocMark[]; text?: string }

export const ARTICLE_CATEGORIES = ["Buying guide", "Product review", "Comparison", "News"] as const
export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number]
export type ArticleStatus = "published" | "draft"

export type Article = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: ArticleCategory
  author: string
  publishedAt: string // YYYY-MM-DD
  updatedAt: string
  status: ArticleStatus
  /** Products featured in the article, shown as cards under it. */
  productIds: string[]
  /** For comparison articles: products to open in the compare page. */
  compareIds: string[]
  seoTitle: string
  seoDescription: string
  doc: DocNode
}
