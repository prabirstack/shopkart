import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Clock, LifeBuoy, Mail, MapPin, MessageCircle, Package, Phone, RotateCcw, ShieldCheck, Truck } from "lucide-react"
import { DemoForm } from "@/components/info/demo-form"
import { InfoPage } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Contact us", description: "Get in touch with ShopKart support about orders, returns, payments or anything else.", alternates: { canonical: "/contact" } }

const channels = [
  { icon: Mail, label: "Email us", value: "support@shopkart.example", note: "Best for order and invoice questions", href: "mailto:support@shopkart.example", tone: "from-rose-500/15 to-rose-500/5 text-rose-600" },
  { icon: Phone, label: "Call us", value: "1800-000-0000", note: "Toll free (sample number)", href: "tel:18000000000", tone: "from-emerald-500/15 to-emerald-500/5 text-emerald-600" },
  { icon: Clock, label: "Support hours", value: "Mon to Sat, 9am to 6pm", note: "Indian Standard Time", tone: "from-amber-500/20 to-amber-500/5 text-amber-600" },
  { icon: MapPin, label: "Visit us", value: "Bengaluru, Karnataka", note: "Sample address, by appointment", tone: "from-sky-500/15 to-sky-500/5 text-sky-600" },
]

const shortcuts = [
  { icon: Package, label: "Track your order", href: "/help/track-order" },
  { icon: RotateCcw, label: "Returns and refunds", href: "/help/returns" },
  { icon: Truck, label: "Shipping and delivery", href: "/help/shipping" },
  { icon: LifeBuoy, label: "Browse all FAQs", href: "/help/faq" },
]

export default function ContactPage() {
  return (
    <InfoPage title="Contact us" intro="Real people, quick answers. Tell us what you need and we'll sort it out." eyebrow="We're here to help" icon={MessageCircle} wide>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map(({ icon: Icon, label, value, note, href, tone }) => {
          const body = (
            <>
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tone}`}><Icon className="size-5" aria-hidden="true" /></span>
              <span className="grid min-w-0 sm:mt-4">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                <span className="mt-0.5 break-words font-semibold leading-snug sm:mt-1">{value}</span>
                <span className="mt-0.5 text-sm text-muted-foreground sm:mt-1">{note}</span>
              </span>
            </>
          )
          const card = "group flex h-full items-center gap-4 rounded-2xl border bg-card p-4 shadow-xs transition-all duration-300 sm:flex-col sm:items-start sm:gap-0 sm:p-5"
          return (
            <li key={label}>
              {href ? <a href={href} className={`${card} hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50`}>{body}</a> : <div className={card}>{body}</div>}
            </li>
          )
        })}
      </ul>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="msg" className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
          <h2 id="msg" className="section-title">Send us a message</h2>
          <p className="mb-6 mt-1.5 text-sm text-muted-foreground">Share a few details and we&apos;ll get back to you, usually within one working day.</p>
          <DemoForm submitLabel="Send message" notice="Messages aren't connected yet. Email us directly using the details above."
            fields={[
              { name: "name", label: "Your name", required: true, half: true, autoComplete: "name" },
              { name: "email", label: "Email", type: "email", required: true, half: true, autoComplete: "email" },
              { name: "topic", label: "Topic", type: "select", required: true, options: ["Order status", "Returns & refunds", "Payments & invoices", "Product question", "Something else"] },
              { name: "order", label: "Order number (optional)", hint: "For example SK-10482" },
              { name: "message", label: "How can we help?", type: "textarea", required: true },
            ]} />
        </section>

        <div className="grid gap-4">
          <aside className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg shadow-primary/20">
            <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 -z-10 size-44 rounded-full bg-white/10" />
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-8 -z-10 size-36 rounded-full bg-black/10" />
            <p className="text-sm font-medium text-primary-foreground/80">Typical first reply</p>
            <p className="mt-1 text-5xl font-bold tracking-tight">&lt; 24h</p>
            <ul className="mt-5 grid gap-2.5 text-sm">
              <li className="flex items-center gap-2.5"><ShieldCheck className="size-4 shrink-0" aria-hidden="true" />Your details stay private</li>
              <li className="flex items-center gap-2.5"><Clock className="size-4 shrink-0" aria-hidden="true" />Mon to Sat, 9am to 6pm IST</li>
              <li className="flex items-center gap-2.5"><MessageCircle className="size-4 shrink-0" aria-hidden="true" />A person answers, not a bot</li>
            </ul>
          </aside>

          <nav aria-labelledby="quick" className="rounded-3xl border bg-card p-3 shadow-xs">
            <h2 id="quick" className="px-3 pb-1 pt-2 text-sm font-semibold">Looking for a quick answer?</h2>
            <ul className="grid">
              {shortcuts.map(({ icon: Icon, label, href }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors hover:bg-primary/5 focus-visible:ring-[3px] focus-visible:ring-ring/50">
                    <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-4" aria-hidden="true" /></span>
                    <span className="flex-1">{label}</span>
                    <ArrowRight className="size-4 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </InfoPage>
  )
}
