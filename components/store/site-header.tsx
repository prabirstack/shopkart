import Link from "next/link"
import { Heart, Package, ShoppingBag, ShoppingCart, User } from "lucide-react"
import { getBestsellers, getBrands, getCategories, getNewArrivals } from "@/features/catalog/data"
import { MENU_LIMIT, buildMenu } from "@/features/catalog/menu"
import { CartCount } from "@/features/cart/cart-count"
import { WishlistCount } from "@/features/wishlist/wishlist-count"
import { MegaNav } from "./mega-nav"
import { MobileNavigation } from "./mobile-navigation"
import { SearchBox } from "./search-box"
import { AutoHideHeader } from "./auto-hide-header"
import { UtilityBar } from "./utility-bar"

const actions = [
  { label: "Orders", href: "/account/orders", icon: Package, wide: true },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart, wide: true, wish: true },
  { label: "Cart", href: "/cart", icon: ShoppingCart, cart: true },
  { label: "Account", href: "/account", icon: User },
]

export async function SiteHeader() {
  const [categories, brands, newArrivals, bestsellers] = await Promise.all([getCategories(), getBrands(), getNewArrivals(MENU_LIMIT), getBestsellers(MENU_LIMIT)])
  const menu = buildMenu(categories, brands, newArrivals, bestsellers)
  return (
    <AutoHideHeader>
    <header className="bg-card shadow-sm">
      <UtilityBar />
      <div className="border-b">
        <div className="store-container grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 py-2 lg:gap-x-8">
          <div className="flex items-center gap-2">
            <div className="lg:hidden"><MobileNavigation categories={categories.filter((c) => c.count > 0).map(({ slug, name }) => ({ slug, name }))} menu={menu} /></div>
            <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <ShoppingBag className="size-8 text-primary" strokeWidth={2.25} aria-hidden="true" />
              ShopKart
            </Link>
          </div>
          <div className="col-span-3 row-start-2 min-w-0 lg:col-span-1 lg:row-start-auto"><SearchBox /></div>
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
      <nav aria-label="Store navigation" className="hidden border-b lg:block"><MegaNav menu={menu} /></nav>
    </header>
    </AutoHideHeader>
  )
}
