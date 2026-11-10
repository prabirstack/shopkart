import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { NewsletterForm } from "./newsletter-form"

const columns = [
  { title: "Shop", links: ["All Categories", "Deals & Offers", "New Arrivals", "Bestsellers", "Gift Cards"] },
  { title: "Help", links: ["Track Your Order", "Returns & Refunds", "FAQs", "Contact Us", "Support"] },
  { title: "About", links: ["About ShopKart", "Careers", "Sell on ShopKart", "Press", "Sustainability"] },
]

export function SiteFooter() {
  return (
    <footer className="mt-10 bg-foreground text-background">
      <div className="store-container grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)_1.4fr]">
        <div>
          <p className="flex items-center gap-2 text-xl font-bold"><ShoppingBag className="size-7 text-primary" aria-hidden="true" /> ShopKart</p>
          <p className="mt-3 max-w-xs text-sm text-background/70">Your one-stop online store for everything you need. Great products, best prices and a seamless shopping experience.</p>
        </div>
        {columns.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <h2 className="text-sm font-semibold">{title}</h2>
            <ul className="mt-3 grid gap-2 text-sm text-background/70">
              {links.map((l) => <li key={l}><Link href="/" className="hover:text-background hover:underline">{l}</Link></li>)}
            </ul>
          </nav>
        ))}
        <div>
          <h2 className="text-sm font-semibold">Stay in the Loop</h2>
          <p className="mb-3 mt-3 text-sm text-background/70">Get the latest deals, new arrivals and exclusive offers straight to your inbox.</p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="store-container flex flex-wrap items-center justify-between gap-2 py-4 text-xs text-background/70">
          <p>© 2026 ShopKart. All rights reserved.</p>
          <ul className="flex flex-wrap gap-4">
            {["Terms & Conditions", "Privacy Policy", "Cookie Policy"].map((l) => <li key={l}><Link href="/" className="hover:underline">{l}</Link></li>)}
          </ul>
        </div>
      </div>
    </footer>
  )
}
