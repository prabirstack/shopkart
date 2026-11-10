import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, HelpCircle, LifeBuoy, Mail, PackageSearch, RotateCcw, Truck, type LucideIcon } from "lucide-react"
import { CtaBand, InfoPage } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Help centre", description: "Track orders, read our return and delivery policies, find answers to common questions or contact ShopKart support.", alternates: { canonical: "/help" } }

const topics: { href: string; title: string; text: string; icon: LucideIcon; tone: string }[] = [
  { href: "/help/track-order", title: "Track your order", text: "See where your parcel is right now.", icon: PackageSearch, tone: "from-sky-500/15 to-sky-500/5 text-sky-600" },
  { href: "/help/returns", title: "Returns & refunds", text: "How to send something back and get paid.", icon: RotateCcw, tone: "from-emerald-500/15 to-emerald-500/5 text-emerald-600" },
  { href: "/help/shipping", title: "Delivery information", text: "Costs, timing and free delivery.", icon: Truck, tone: "from-amber-500/20 to-amber-500/5 text-amber-600" },
  { href: "/help/faq", title: "FAQs", text: "Quick answers to common questions.", icon: HelpCircle, tone: "from-violet-500/15 to-violet-500/5 text-violet-600" },
  { href: "/contact", title: "Contact us", text: "Talk to a real person.", icon: Mail, tone: "from-rose-500/15 to-rose-500/5 text-rose-600" },
]

export default function HelpPage() {
  return (
    <InfoPage title="Help centre" intro="How can we help you today? Pick a topic or reach out and we'll sort it." eyebrow="Support" icon={LifeBuoy} wide>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map(({ href, title, text, icon: Icon, tone }) => (
          <li key={href}>
            <Link href={href} className="group relative flex h-full items-start gap-4 rounded-2xl border bg-card p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tone} transition-transform duration-300 group-hover:scale-110`}><Icon className="size-6" aria-hidden="true" /></span>
              <span className="grid gap-0.5"><span className="font-semibold">{title}</span><span className="text-sm leading-relaxed text-muted-foreground">{text}</span></span>
              <ArrowUpRight className="absolute right-4 top-4 size-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary group-hover:opacity-100" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <CtaBand title="Still need a hand?" text="Our team replies within one working day, Monday to Saturday." primary={{ href: "/contact", label: "Contact support" }} secondary={{ href: "/help/faq", label: "Read the FAQs" }} />
    </InfoPage>
  )
}
