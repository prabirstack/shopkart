import Link from "next/link"
import { Search } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { categories } from "@/features/catalog/demo"

export function NotFoundContent() {
  return (
    <main className="store-container grid place-items-center py-16">
      <div className="grid max-w-xl justify-items-center gap-5 text-center">
        <p className="text-7xl font-extrabold tracking-tight text-primary">404</p>
        <h1 className="store-title">We can&apos;t find that page</h1>
        <p className="text-muted-foreground">The link may be old, or the product may have sold out and been removed. Try a search or head back to the shop.</p>
        <form action="/products" method="get" role="search" className="flex w-full overflow-hidden rounded-lg border bg-background focus-within:ring-[3px] focus-within:ring-ring/40">
          <label htmlFor="nf-search" className="sr-only">Search products</label>
          <input id="nf-search" name="q" type="search" placeholder="Search for products…" className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
          <button type="submit" aria-label="Search" className="grid w-14 place-items-center bg-primary text-primary-foreground"><Search className="size-5" aria-hidden="true" /></button>
        </form>
        <div className="flex flex-wrap justify-center gap-2"><Link href="/" className={buttonVariants()}>Go to homepage</Link><Link href="/products" className={buttonVariants({ variant: "outline" })}>Browse the shop</Link></div>
        <ul aria-label="Popular categories" className="flex flex-wrap justify-center gap-2 text-sm">
          {categories.slice(0, 6).map((c) => <li key={c.slug}><Link href={`/products?category=${c.slug}`} className="rounded-full border px-3 py-1 hover:bg-muted">{c.name}</Link></li>)}
        </ul>
      </div>
    </main>
  )
}
