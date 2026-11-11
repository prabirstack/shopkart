import Link from "next/link"
import { ShoppingBag } from "lucide-react"
import { NewsletterForm } from "./newsletter-form"

const columns = [
  { title: "Shop", links: [["All Categories", "/categories"], ["Deals & Offers", "/deals"], ["New Arrivals", "/new-arrivals"], ["Bestsellers", "/bestsellers"], ["Gift Cards", "/gift-cards"]] },
  { title: "Help", links: [["Track Your Order", "/help/track-order"], ["Returns & Refunds", "/help/returns"], ["FAQs", "/help/faq"], ["Contact Us", "/contact"], ["Support", "/help"]] },
  { title: "About", links: [["About ShopKart", "/about"], ["Careers", "/careers"], ["Sell on ShopKart", "/sell"], ["Buying guides", "/news"], ["Press", "/press"], ["Sustainability", "/sustainability"]] },
]

export function SiteFooter() {
  const socials = [
    { label: "Facebook", href: "https://www.facebook.com/", mark: <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="currentColor"><path d="M13.5 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.5 1.6-1.5h1.7V3.1c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.6v2H7v3.2h2.8V21z" /></svg> },
    { label: "Instagram", href: "https://www.instagram.com/", mark: <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.1"/><circle cx="17.8" cy="6.5" r=".8" fill="currentColor" stroke="none"/></svg> },
    { label: "YouTube", href: "https://www.youtube.com/", mark: <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6z"/></svg> },
    { label: "LinkedIn", href: "https://www.linkedin.com/", mark: <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="currentColor"><path d="M5.2 3a2.2 2.2 0 1 0 0 4.4 2.2 2.2 0 0 0 0-4.4ZM3.3 9h3.8v12H3.3zM9.5 9h3.6v1.6h.1A4 4 0 0 1 16.8 8c3.9 0 4.6 2.5 4.6 5.8V21h-3.8v-6.4c0-1.5 0-3.4-2.1-3.4s-2.4 1.6-2.4 3.3V21H9.5z"/></svg> },
  ]
  return (
    <footer className="store-footer relative isolate mt-12 overflow-hidden rounded-t-[2rem] border-t border-white/10 bg-[#101827] text-slate-50 shadow-[0_-18px_60px_-42px_rgba(15,23,42,0.55)] sm:mt-16 sm:rounded-t-[2.5rem]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-48 -z-10 size-[32rem] rounded-full bg-red-500/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent" />
      <div className="store-container grid gap-x-10 gap-y-12 py-14 sm:py-16 md:grid-cols-2 lg:grid-cols-[1.35fr_repeat(3,0.8fr)_1.35fr] lg:gap-x-12 lg:py-20">
        <div>
          <p className="flex items-center gap-2 text-xl font-bold"><ShoppingBag className="size-7 text-primary" aria-hidden="true" /> ShopKart</p>
          <p className="mt-4 max-w-xs text-sm leading-7 text-background/70">Your one-stop online store for everything you need. Great products, best prices and a seamless shopping experience.</p>
          <nav aria-label="ShopKart on social media" className="mt-6 flex items-center gap-3">
            {socials.map(({ label, href, mark }) => <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`ShopKart on ${label}`} className="grid size-9 place-items-center rounded-full border border-white/15 text-background/75 transition hover:border-primary hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{mark}</a>)}
          </nav>
        </div>
        {columns.map(({ title, links }) => (
          <nav key={title} aria-label={title}>
            <h2 className="text-sm font-semibold">{title}</h2>
            <ul className="mt-5 grid gap-3 text-sm text-background/70">
              {links.map(([label, href]) => <li key={label}><Link href={href} className="hover:text-background hover:underline">{label}</Link></li>)}
            </ul>
          </nav>
        ))}
        <div>
          <h2 className="text-sm font-semibold">Stay in the Loop</h2>
          <p className="mb-5 mt-5 text-sm leading-7 text-background/70">Get the latest deals, new arrivals and exclusive offers straight to your inbox.</p>
          <NewsletterForm variant="footer" />
        </div>
      </div>
      <div className="border-t border-white/10 bg-black/15">
        <div className="store-container flex flex-wrap items-center justify-between gap-4 py-6 text-xs text-slate-300/75 sm:py-7">
          <p>© 2026 ShopKart. All rights reserved.</p>
          <ul className="flex flex-wrap gap-4">
            {[["Terms & Conditions", "/terms"], ["Privacy Policy", "/privacy"], ["Cookie Policy", "/cookies"]].map(([l, href]) => <li key={l}><Link href={href} className="hover:underline">{l}</Link></li>)}
          </ul>
        </div>
      </div>
    </footer>
  )
}
