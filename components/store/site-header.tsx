import Link from "next/link"
import { ChevronDown, Flame, Heart, LayoutGrid, Package, Search, ShoppingBag, ShoppingCart, User } from "lucide-react"
import { CartCount } from "@/features/cart/cart-count"
import { WishlistCount } from "@/features/wishlist/wishlist-count"
import { MobileNavigation } from "./mobile-navigation"
import { UtilityBar } from "./utility-bar"

const navLinks = ["New Arrivals", "Bestsellers", "Top Selling", "Brands", "Gift Cards", "Sell on ShopKart"]

const actions = [
  { label: "Orders", href: "/account/orders", icon: Package, wide: true },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart, wide: true, wish: true },
  { label: "Cart", href: "/cart", icon: ShoppingCart, cart: true },
  { label: "Account", href: "/account", icon: User },
]

export function SiteHeader() {
  return (
    <header className="bg-background">
      <UtilityBar />
      <div className="border-b">
        <div className="store-container grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 py-3 lg:gap-x-8">
          <div className="flex items-center gap-2">
            <div className="lg:hidden"><MobileNavigation /></div>
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <ShoppingBag className="size-8 text-primary" strokeWidth={2.25} aria-hidden="true" />
              ShopKart
            </Link>
          </div>
          <form action="/products" method="get" role="search"
            className="col-span-3 row-start-2 flex min-w-0 overflow-hidden rounded-lg border bg-background focus-within:ring-[3px] focus-within:ring-ring/40 lg:col-span-1 lg:row-start-auto">
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input id="site-search" name="q" type="search" maxLength={100}
              placeholder="Search for products, brands and more..."
              className="h-11 min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-muted-foreground" />
            <button type="submit" aria-label="Search"
              className="grid w-14 place-items-center bg-primary text-primary-foreground hover:bg-primary/90">
              <Search className="size-5" aria-hidden="true" />
            </button>
          </form>
          <ul className="col-start-3 row-start-1 flex items-center gap-1 lg:gap-5">
            {actions.map(({ label, href, icon: Icon, cart, wish, wide }) => (
              <li key={label} className={wide ? "hidden sm:block" : undefined}>
                <Link href={href} className="relative flex flex-col items-center gap-0.5 px-2 text-xs font-medium">
                  <Icon className="size-6" aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                  {cart && <CartCount />}
                  {wish && <WishlistCount />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <nav aria-label="Store navigation" className="hidden border-b lg:block">
        <div className="store-container grid grid-cols-[14rem_minmax(0,1fr)] items-center gap-4">
          <Link href="/categories" className="my-2 flex h-11 items-center justify-between rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <span className="flex items-center gap-3"><LayoutGrid className="size-5" aria-hidden="true" /> All Categories</span>
            <ChevronDown className="size-4" aria-hidden="true" />
          </Link>
          <ul className="flex items-center justify-between text-sm font-medium">
            <li>
              <Link href="/deals" className="flex items-center gap-1.5 hover:text-primary">
                <Flame className="size-4 text-primary" aria-hidden="true" /> Deals
              </Link>
            </li>
            {navLinks.map((label) => (
              <li key={label}>
                <Link href="/products" className="flex items-center gap-1 hover:text-primary">
                  {label}
                  {label === "Brands" && <ChevronDown className="size-3.5" aria-hidden="true" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
