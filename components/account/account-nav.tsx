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
    <nav aria-label="Account" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:overflow-visible lg:px-0">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/account" ? pathname === href : pathname.startsWith(href)
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            <Icon className="size-4" aria-hidden="true" /> {label}
          </Link>
        )
      })}
    </nav>
  )
}
