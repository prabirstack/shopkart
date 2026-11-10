"use client"
import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { categories } from "@/features/catalog/demo"
import { bestsellerCategories, brandStats, newArrivalCategories } from "@/features/catalog/menu"
import { ChevronDown } from "lucide-react"

export function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger aria-label="Open navigation"
        className={buttonVariants({ variant: "outline", size: "icon" })}>
        <Menu aria-hidden="true" />
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>ShopKart</SheetTitle>
          <SheetDescription>Browse the store.</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobile navigation" className="grid gap-1 px-4 pb-6 text-sm">
          <Link href="/deals" onClick={close} className="rounded-md px-2 py-2 font-medium hover:bg-muted">Deals</Link>
          {[
            { label: "New Arrivals", href: "/new-arrivals", items: newArrivalCategories.map((c) => ({ label: `${c.name} (${c.count})`, href: `/products?category=${c.slug}` })) },
            { label: "Bestsellers", href: "/bestsellers", items: bestsellerCategories.map((c) => ({ label: `${c.name} (${c.count})`, href: `/products?category=${c.slug}` })) },
            { label: "Brands", href: "/brands", items: brandStats.map((b) => ({ label: b.name, href: `/products?brand=${encodeURIComponent(b.name)}` })) },
          ].map((g) => (
            <details key={g.label} className="group rounded-md">
              <summary className="flex cursor-pointer list-none items-center justify-between rounded-md px-2 py-2 font-medium hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">{g.label}<ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
              <ul className="ml-2 grid gap-0.5 border-l pl-3">
                <li><Link href={g.href} onClick={close} className="block rounded-md px-2 py-1.5 font-medium text-primary hover:bg-muted">View all {g.label.toLowerCase()}</Link></li>
                {g.items.map((it) => <li key={it.href}><Link href={it.href} onClick={close} className="block rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">{it.label}</Link></li>)}
              </ul>
            </details>
          ))}
          {[["Top Selling", "/top-selling"], ["Gift Cards", "/gift-cards"], ["Help", "/help"]].map(([label, href]) => (
            <Link key={label} href={href} onClick={close} className="rounded-md px-2 py-2 font-medium hover:bg-muted">{label}</Link>
          ))}
          <p className="mt-4 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Categories</p>
          {categories.map(({ slug, name, icon: Icon }) => (
            <Link key={slug} href={`/categories/${slug}`} onClick={close}
              className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted">
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" /> {name}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
