import Link from "next/link"
import { ArrowRight, Search } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { getCategories } from "@/features/catalog/data"

export async function NotFoundContent() {
  const categories = (await getCategories()).filter((c) => c.count > 0)
  return (
    <main className="relative isolate grid place-items-center overflow-hidden px-4 py-16 sm:py-24">
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,oklch(0.528_0.202_21.4/0.16)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10 -z-10 size-[30rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      <div className="grid max-w-xl justify-items-center gap-5 text-center">
        <p aria-hidden="true" className="bg-gradient-to-b from-primary to-primary/40 bg-clip-text text-8xl font-black tracking-tighter text-transparent sm:text-9xl">404</p>
        <h1 className="store-title">We can&apos;t find that page</h1>
        <p className="text-muted-foreground">The link may be old, or the product may have sold out and been removed. Try a search or head back to the shop.</p>
        <form action="/products" method="get" role="search" className="flex w-full overflow-hidden rounded-2xl border bg-background shadow-sm transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15">
          <label htmlFor="nf-search" className="sr-only">Search products</label>
          <input id="nf-search" name="q" type="search" placeholder="Search for products…" className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none" />
          <button type="submit" aria-label="Search" className="grid w-14 place-items-center bg-primary text-primary-foreground transition-colors hover:bg-primary/90"><Search className="size-5" aria-hidden="true" /></button>
        </form>
        <div className="flex flex-wrap justify-center gap-3"><Link href="/" className={buttonVariants({ size: "lg" }) + " h-11 rounded-xl shadow-md shadow-primary/25"}>Go to homepage</Link><Link href="/products" className={buttonVariants({ variant: "outline", size: "lg" }) + " group h-11 rounded-xl"}>Browse the shop<ArrowRight className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link></div>
        <ul aria-label="Popular categories" className="flex flex-wrap justify-center gap-2 text-sm">
          {categories.slice(0, 6).map((c) => <li key={c.slug}><Link href={`/products?category=${c.slug}`} className="rounded-full border bg-background px-3.5 py-1.5 font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary">{c.name}</Link></li>)}
        </ul>
      </div>
    </main>
  )
}
