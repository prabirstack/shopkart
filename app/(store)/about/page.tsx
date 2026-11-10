import type { Metadata } from "next"
import Link from "next/link"
import { BadgeCheck, HeartHandshake, Truck, Zap, type LucideIcon } from "lucide-react"
import { DraftNotice, InfoPage, Prose } from "@/components/info/info-page"

export const metadata: Metadata = { title: "About ShopKart", description: "ShopKart is an online store for everyday electronics, fashion, home and kitchen products with fair prices, clear policies and honest service.", alternates: { canonical: "/about" } }

const values: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BadgeCheck, title: "Honest listings", text: "Prices include GST. Discounts are real and sale timers are real." },
  { icon: Truck, title: "Predictable delivery", text: "You see the cost and the timing before you pay." },
  { icon: HeartHandshake, title: "Easy returns", text: "A clear 7-day window and a simple way to start a return." },
  { icon: Zap, title: "Fast, fair support", text: "Real people who reply within a working day." },
]

export default function AboutPage() {
  return (
    <InfoPage title="About ShopKart" intro="An online store built around clear prices, clear policies and fewer surprises." wide>
      <DraftNotice>Starter company copy for the demo store. Replace with your real story before launch.</DraftNotice>
      <div className="max-w-3xl"><Prose title="Our story"><p>ShopKart brings everyday essentials together in one place: electronics, fashion, home, kitchen, beauty and more. We focus on products people actually use, and we try to make buying them simple.</p><p>That means GST-inclusive prices, tax invoices with every order, and checkout that says exactly what you will pay.</p></Prose></div>
      <section aria-labelledby="values"><h2 id="values" className="section-title mb-3">What we stand for</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{values.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-xl border bg-card p-5"><Icon className="mb-3 size-7 text-primary" aria-hidden="true" /><p className="font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></li>))}</ul></section>
      <p className="text-sm">Questions? <Link href="/contact" className="font-medium text-primary hover:underline">Contact us</Link> or visit the <Link href="/help" className="font-medium text-primary hover:underline">help centre</Link>.</p>
    </InfoPage>
  )
}
