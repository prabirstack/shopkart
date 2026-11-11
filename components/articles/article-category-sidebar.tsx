import Link from "next/link"
import Image from "next/image"
import { categoryImage } from "@/features/catalog/images"
import { ArrowUpRight } from "lucide-react"
import { ARTICLE_CATEGORIES, type Article, type ArticleCategory } from "@/features/articles/types"

const labels: Record<ArticleCategory, string> = {
  "Buying guide": "Buying guides", "Product review": "Product reviews", Comparison: "Comparisons", News: "News",
}

export function ArticleCategorySidebar({ articles, selected }: { articles: Article[]; selected?: "all" | ArticleCategory }) {
  return (
    <aside className="order-first flex min-w-0 flex-col border-y py-4 xl:order-none xl:self-stretch xl:border-y-0 xl:border-l xl:py-0 xl:pl-6">
      <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em]">Explore by category</h3>
      <nav aria-label="Article categories" className="grid grid-cols-2 gap-x-5 sm:grid-cols-3 xl:grid-cols-1">
        {(["all", ...ARTICLE_CATEGORIES] as const).map(category => {
          const count = category === "all" ? articles.length : articles.filter(article => article.category === category).length
          return <Link key={category} href={category === "all" ? "/news" : `/news?category=${encodeURIComponent(category)}`} aria-current={selected === category ? "page" : undefined}
            className={`group flex min-h-11 items-center justify-between gap-2 border-b py-3 text-xs font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-primary ${selected === category ? "text-primary" : "text-muted-foreground"}`}>
            <span>{category === "all" ? "All articles" : labels[category]}</span><span className="text-[10px] tabular-nums">{count}</span>
          </Link>
        })}
      </nav>
      <Link href="/products?category=electronics" aria-label="ShopKart promotion: explore electronics" className="group mt-6 flex min-h-64 flex-1 flex-col overflow-hidden rounded-xl bg-[#161c2b] p-5 text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
        <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-white/60">ShopKart promotion</span>
        <span className="mt-3 font-serif text-xl leading-tight">Find your next<br />great sound.</span>
        <span className="mt-2 text-xs leading-relaxed text-white/70">Explore everyday audio essentials.</span>
        <span className="relative my-3 block min-h-28 flex-1">
          <Image src={categoryImage("electronics")!} alt="Black over-ear headphones" fill sizes="(min-width: 1280px) 180px, 280px" className="object-contain transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none" />
        </span>
        <span className="flex items-center justify-between border-t border-white/20 pt-3 text-xs font-semibold">Explore electronics <ArrowUpRight className="size-4" aria-hidden="true" /></span>
      </Link>
    </aside>
  )
}
