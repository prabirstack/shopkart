import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { NewsletterForm } from "./newsletter-form"

const columns = [
  { title: "Shop", links: [["All Categories", "/categories"], ["Deals & Offers", "/deals"], ["New Arrivals", "/new-arrivals"], ["Bestsellers", "/bestsellers"], ["Gift Cards", "/gift-cards"]] },
  { title: "Help", links: [["Track Your Order", "/help/track-order"], ["Returns & Refunds", "/help/returns"], ["FAQs", "/help/faq"], ["Contact Us", "/contact"], ["Support", "/help"]] },
  { title: "About", links: [["About ShopKart", "/about"], ["Careers", "/careers"], ["Sell on ShopKart", "/sell"], ["Press", "/press"], ["Sustainability", "/sustainability"]] },
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
              {links.map(([label, href]) => <li key={label}><Link href={href} className="hover:text-background hover:underline">{label}</Link></li>)}
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
            {[["Terms & Conditions", "/terms"], ["Privacy Policy", "/privacy"], ["Cookie Policy", "/cookies"]].map(([l, href]) => <li key={l}><Link href={href} className="hover:underline">{l}</Link></li>)}
          </ul>
        </div>
      </div>
    </footer>
  )
}
