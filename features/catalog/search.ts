import { brands, bySlug, catalog, categories, type Product } from "./demo"

/**
 * Small in-memory search used while the catalog is demo data. The same ranking
 * rules move into a database/search-engine query in a later chapter.
 */

const SYNONYMS: Record<string, string[]> = {
  phone: ["smartphone", "mobile", "mobiles"],
  mobile: ["smartphone", "phone"],
  earphones: ["earbuds", "headphones"],
  earphone: ["earbuds", "headphones"],
  headset: ["headphones"],
  laptop: ["ultrabook", "laptops"],
  watch: ["smartwatch", "band"],
  shoes: ["sneakers"],
  shoe: ["sneakers"],
  bag: ["backpack"],
  cooker: ["rice"],
  blender: ["mixer", "grinder"],
  console: ["gaming", "controller"],
  sofa: ["armchair"],
  chair: ["armchair"],
}

export const normalize = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim()

export const tokenize = (s: string) => normalize(s).split(" ").filter(Boolean)

/** Edit distance, capped: returns max+1 as soon as the words are too different. */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      rowMin = Math.min(rowMin, cur[j])
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

// Short words never fuzzy-match: "band" would otherwise match "and" everywhere.
const fuzzyLimit = (w: string) => (w.length >= 8 ? 2 : w.length >= 5 ? 1 : 0)

function wordScore(token: string, words: string[], weight: number): number {
  let best = 0
  for (const w of words) {
    if (w === token) return weight * 2
    if (w.startsWith(token)) best = Math.max(best, weight * 1.5)
    else if (token.length >= 3 && w.includes(token)) best = Math.max(best, weight)
    else if (w.length >= 4 && editDistance(token, w, fuzzyLimit(token)) <= fuzzyLimit(token)) best = Math.max(best, weight * 0.6)
  }
  return best
}

const fields = (p: Product) => ({
  title: tokenize(p.title),
  brand: tokenize(p.brand),
  category: tokenize(bySlug(p.category).name),
  description: tokenize(p.description),
})

/** Synonyms for a word, including typos of a synonym key ("earfones" -> "earphones"). */
function synonymsFor(token: string): string[] {
  if (SYNONYMS[token]) return SYNONYMS[token]
  if (token.length < 5) return []
  const limit = fuzzyLimit(token)
  const key = Object.keys(SYNONYMS).find((k) => k.length >= 5 && editDistance(token, k, limit) <= limit)
  return key ? [key, ...SYNONYMS[key]] : []
}

/** Splits "airfryer" into "air" + "fryer" when both halves are known words. */
function splitCompound(token: string): string[] {
  if (token.length < 6 || vocabulary.includes(token)) return [token]
  for (let i = 3; i <= token.length - 3; i++) {
    const a = token.slice(0, i), b = token.slice(i)
    if (vocabulary.includes(a) && vocabulary.includes(b)) return [a, b]
  }
  return [token]
}

/** 0 means "does not match". Every query word must match somewhere (AND). */
export function scoreProduct(p: Product, query: string): number {
  const tokens = tokenize(query).flatMap(splitCompound)
  if (tokens.length === 0) return 1
  const f = fields(p)
  let total = 0
  for (const token of tokens) {
    const variants = [token, ...synonymsFor(token)]
    let tokenBest = 0
    variants.forEach((v, i) => {
      const damp = i === 0 ? 1 : 0.8
      const s = wordScore(v, f.title, 5) + wordScore(v, f.brand, 4) + wordScore(v, f.category, 3) + wordScore(v, f.description, 1)
      tokenBest = Math.max(tokenBest, s * damp)
    })
    if (tokenBest === 0) return 0
    total += tokenBest
  }
  return total
}

export function searchProducts(query: string, pool: Product[] = catalog): Product[] {
  return pool
    .map((p) => ({ p, s: scoreProduct(p, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.p)
}

export type Suggestions = {
  products: Product[]
  categories: { slug: string; name: string }[]
  brands: string[]
}

export function suggest(query: string): Suggestions {
  const q = normalize(query)
  if (q.length === 0) return { products: [], categories: [], brands: [] }
  return {
    products: searchProducts(q).slice(0, 5),
    categories: categories.filter((c) => normalize(c.name).split(" ").some((w) => w.startsWith(q)) || normalize(c.name).includes(q)).slice(0, 3).map(({ slug, name }) => ({ slug, name })),
    brands: brands.filter((b) => normalize(b).startsWith(q)).slice(0, 3),
  }
}

const vocabulary = Array.from(new Set(catalog.flatMap((p) => [...tokenize(p.title), ...tokenize(p.brand), ...tokenize(bySlug(p.category).name)]).filter((w) => w.length >= 3)))

/** Suggests a corrected query when some words are close to known words, else null. */
export function didYouMean(query: string): string | null {
  const tokens = tokenize(query)
  let changed = false
  const fixed = tokens.map((t) => {
    if (vocabulary.includes(t) || SYNONYMS[t] || t.length < 4) return t
    let best: string | null = null, bestD = 3
    for (const w of vocabulary) {
      const d = editDistance(t, w, 2)
      if (d < bestD) { best = w; bestD = d }
    }
    if (best && bestD <= 2) { changed = true; return best }
    return t
  })
  return changed ? fixed.join(" ") : null
}
