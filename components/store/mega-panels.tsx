"use client"
import Link from "next/link"
import { ArrowRight, Sparkles, Star, Store, ThumbsUp } from "lucide-react"
import { Price } from "@/components/price"
import { ProductArt } from "./product-art"
import { discountPercent, type Product } from "@/features/catalog/demo"
import { bestsellerCategories, brandIndex, brandStats, justIn, menuTotals, newArrivalCategories, topRated, type CountedCategory } from "@/features/catalog/menu"

export type MenuId = "new" | "best" | "brands"

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
}

function CategoryList({ items, label }: { items: CountedCategory[]; label: string }) {
  return (
    <nav aria-label={label}>
      <Heading>{label}</Heading>
      <ul className="grid gap-0.5">
        {items.map(({ slug, name, icon: Icon, count, tint, iconColor }) => (
          <li key={slug}>
            <Link href={`/products?category=${slug}`} className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${tint}`}><Icon className={`size-4 ${iconColor}`} aria-hidden="true" /></span>
              <span className="flex-1 font-medium group-hover:text-primary">{name}</span>
              <span className="price rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground group-hover:bg-background">{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function MiniProduct({ p, rank }: { p: Product; rank?: number }) {
  const off = discountPercent(p)
  return (
    <Link href={`/products/${p.slug}`} className="group grid gap-3 rounded-xl border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <span className="relative block aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-neutral-50 to-neutral-200/80">
        <span className="absolute inset-0 transition-transform duration-500 group-hover:scale-110"><ProductArt slug={p.slug} title="" icon={p.icon} sizes="180px" /></span>
        {rank && <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-foreground text-xs font-bold text-background">{rank}</span>}
        {!rank && off > 0 && <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-xs font-semibold text-primary-foreground">-{off}%</span>}
      </span>
      <span className="grid gap-1">
        <span className="text-xs text-muted-foreground">{p.brand}</span>
        <span className="line-clamp-2 min-h-[2.5em] text-sm font-medium leading-snug group-hover:text-primary">{p.title}</span>
        {p.rating && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" /><span className="font-medium text-foreground">{p.rating}</span>({p.reviews})</span>}
        <Price cents={p.pricePaise} compareAtCents={p.comparePaise} showDiscountLabel={false} priceClassName="text-primary" className="[&_del]:text-xs" />
      </span>
    </Link>
  )
}

function Promo({ tone, icon: Icon, eyebrow, title, text, href, cta }: { tone: string; icon: typeof Sparkles; eyebrow: string; title: string; text: string; href: string; cta: string }) {
  return (
    <Link href={href} className={`group relative flex min-h-60 flex-col justify-end overflow-hidden rounded-2xl p-5 text-white transition-shadow hover:shadow-xl focus-visible:ring-[3px] focus-visible:ring-ring/50 ${tone}`}>
      <Icon className="absolute -right-4 -top-4 size-36 opacity-15 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110" strokeWidth={1} aria-hidden="true" />
      <span className="relative mb-auto w-fit rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur">{eyebrow}</span>
      <span className="relative text-2xl font-extrabold leading-tight">{title}</span>
      <span className="relative mt-1 text-sm text-white/85">{text}</span>
      <span className="relative mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-foreground transition-transform group-hover:translate-x-0.5">{cta}<ArrowRight className="size-4" aria-hidden="true" /></span>
    </Link>
  )
}

function Footer({ href, label, note }: { href: string; label: string; note: string }) {
  return (
    <div className="col-span-full flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm">
      <p className="text-muted-foreground">{note}</p>
      <Link href={href} className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">{label}<ArrowRight className="size-4" aria-hidden="true" /></Link>
    </div>
  )
}

export function MegaPanel({ id }: { id: MenuId }) {
  const grid = "grid gap-x-8 gap-y-5 lg:grid-cols-[13rem_minmax(0,1fr)_16rem] xl:grid-cols-[15rem_minmax(0,1fr)_18rem]"
  if (id === "new") return (
    <div className={grid}>
      <CategoryList items={newArrivalCategories} label="New in categories" />
      <section aria-label="Just in"><Heading>Just in</Heading><ul className="grid grid-cols-3 gap-3">{justIn.map((p) => <li key={p.id}><MiniProduct p={p} /></li>)}</ul></section>
      <Promo tone="bg-gradient-to-br from-neutral-900 via-red-950 to-primary" icon={Sparkles} eyebrow="Fresh this week" title="New arrivals, every week" text="Be first to the latest gadgets, home and style picks." href="/new-arrivals" cta="Shop new arrivals" />
      <Footer href="/new-arrivals" label={`View all ${menuTotals.newArrivals} new arrivals`} note="Updated weekly. Free delivery on orders above ₹699." />
    </div>
  )
  if (id === "best") return (
    <div className={grid}>
      <CategoryList items={bestsellerCategories} label="Bestsellers by category" />
      <section aria-label="Customer favourites"><Heading>Customer favourites</Heading><ul className="grid grid-cols-3 gap-3">{topRated.map((p, i) => <li key={p.id}><MiniProduct p={p} rank={i + 1} /></li>)}</ul></section>
      <Promo tone="bg-gradient-to-br from-amber-500 via-orange-600 to-red-700" icon={ThumbsUp} eyebrow="Loved by shoppers" title="Rated 4.5★ and above" text="The products people rate highest and keep re-ordering." href="/products?rating=4.5&sort=rating" cta="Shop top rated" />
      <Footer href="/bestsellers" label={`View all ${menuTotals.bestsellers} bestsellers`} note="Ranked by rating, then by number of reviews." />
    </div>
  )
  return (
    <div className="grid gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_14rem_16rem] xl:grid-cols-[minmax(0,1fr)_15rem_18rem]">
      <section aria-label="Popular brands">
        <Heading>Popular brands</Heading>
        <ul className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {brandStats.map((b) => (
            <li key={b.name}>
              <Link href={`/products?brand=${encodeURIComponent(b.name)}`} className="group grid h-[4.5rem] place-content-center rounded-xl border bg-card px-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <span className="text-sm font-bold tracking-wide group-hover:text-primary">{b.name}</span>
                <span className="text-xs text-muted-foreground">{b.count} {b.count === 1 ? "product" : "products"}{b.topCategory && ` · ${b.topCategory}`}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <nav aria-label="Brands A to Z">
        <Heading>Brands A to Z</Heading>
        <dl className="grid gap-2 text-sm">
          {brandIndex.map(({ letter, brands }) => (
            <div key={letter} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-baseline gap-2">
              <dt className="font-bold text-primary">{letter}</dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1">{brands.map((b) => <Link key={b.name} href={`/products?brand=${encodeURIComponent(b.name)}`} className="hover:text-primary hover:underline">{b.name}</Link>)}</dd>
            </div>
          ))}
        </dl>
      </nav>
      <Promo tone="bg-gradient-to-br from-slate-800 via-slate-900 to-black" icon={Store} eyebrow="Brand stores" title="Shop your favourite brands" text="Genuine products with brand warranty and a GST invoice." href="/brands" cta="Browse all brands" />
      <Footer href="/brands" label={`View all ${menuTotals.brands} brands`} note="Every brand product ships with a GST invoice and manufacturer warranty." />
    </div>
  )
}
