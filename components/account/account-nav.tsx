"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CreditCard, Heart, LayoutDashboard, MapPin, Package, Ticket, User } from "lucide-react"

const items = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/billing", label: "Billing history", icon: CreditCard },
  { href: "/account/coupons", label: "Coupons", icon: Ticket },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/profile", label: "Profile", icon: User },
]

export function AccountNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Account" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:gap-1 lg:overflow-visible lg:px-3 lg:pb-3 lg:pt-5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href)
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-muted hover:text-foreground"}`}>
            <span className={`grid size-8 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted group-hover:bg-background"}`}><Icon className="size-4" aria-hidden="true" /></span>{label}
          </Link>
        )
      })}
    </nav>
  )
}
