const illustratedArticles = new Set([
  "choose-wireless-earbuds",
  "air-fryer-buying-guide",
  "wireless-earbuds-anc-review",
  "earbuds-vs-headphones",
  "smartwatch-vs-fitness-band",
  "gift-ideas-under-2000",
])

/** Local editorial artwork; new articles retain the category cover until artwork is added. */
export function articleImage(slug: string): string | undefined {
  return illustratedArticles.has(slug) ? `/images/articles/${slug}.webp` : undefined
}
