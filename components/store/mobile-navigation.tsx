"use client"
import Link from "next/link"
import { useState } from "react"
import { Menu } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { categories } from "@/features/catalog/demo"

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
          {[["Deals", "/deals"], ["New Arrivals", "/new-arrivals"], ["Bestsellers", "/bestsellers"], ["Gift Cards", "/gift-cards"], ["Help", "/help"]].map(([label, href]) => (
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
