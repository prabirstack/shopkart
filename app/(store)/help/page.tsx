import type { Metadata } from "next"
import Link from "next/link"
import { Mail, PackageSearch, RotateCcw, Truck, HelpCircle, type LucideIcon } from "lucide-react"
import { InfoPage } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Help centre", description: "Track orders, read our return and delivery policies, find answers to common questions or contact ShopKart support.", alternates: { canonical: "/help" } }

const topics: { href: string; title: string; text: string; icon: LucideIcon }[] = [
  { href: "/help/track-order", title: "Track your order", text: "See where your parcel is right now.", icon: PackageSearch },
  { href: "/help/returns", title: "Returns & refunds", text: "How to send something back and get paid.", icon: RotateCcw },
  { href: "/help/shipping", title: "Delivery information", text: "Costs, timing and free delivery.", icon: Truck },
  { href: "/help/faq", title: "FAQs", text: "Quick answers to common questions.", icon: HelpCircle },
  { href: "/contact", title: "Contact us", text: "Talk to a real person.", icon: Mail },
]

export default function HelpPage() {
  return (
    <InfoPage title="Help centre" intro="How can we help you today?" wide>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map(({ href, title, text, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex h-full items-start gap-4 rounded-xl border bg-card p-5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
              <span><span className="block font-semibold">{title}</span><span className="text-sm text-muted-foreground">{text}</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </InfoPage>
  )
}
