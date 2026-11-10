import type { Metadata } from "next"
import { BadgeCheck, CheckCircle2, HeartHandshake, Sparkles, Truck, Zap, type LucideIcon } from "lucide-react"
import { CtaBand, DraftNotice, InfoPage, Prose } from "@/components/info/info-page"

export const metadata: Metadata = { title: "About ShopKart", description: "ShopKart is an online store for everyday electronics, fashion, home and kitchen products with fair prices, clear policies and honest service.", alternates: { canonical: "/about" } }

const values: { icon: LucideIcon; title: string; text: string; tone: string }[] = [
  { icon: BadgeCheck, title: "Honest listings", text: "Prices include GST. Discounts are real and sale timers are real.", tone: "from-rose-500/15 to-rose-500/5 text-rose-600" },
  { icon: Truck, title: "Predictable delivery", text: "You see the cost and the timing before you pay.", tone: "from-sky-500/15 to-sky-500/5 text-sky-600" },
  { icon: HeartHandshake, title: "Easy returns", text: "A clear 7-day window and a simple way to start a return.", tone: "from-emerald-500/15 to-emerald-500/5 text-emerald-600" },
  { icon: Zap, title: "Fast, fair support", text: "Real people who reply within a working day.", tone: "from-amber-500/20 to-amber-500/5 text-amber-600" },
]

const promises = ["GST-inclusive prices, always", "A tax invoice with every order", "No surprise fees at checkout", "Returns without the runaround"]

export default function AboutPage() {
  return (
    <InfoPage title="About ShopKart" intro="An online store built around clear prices, clear policies and fewer surprises." eyebrow="Our story" icon={Sparkles} wide>
      <DraftNotice>Starter company copy for the demo store. Replace with your real story before launch.</DraftNotice>

      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Prose title="Our story">
          <p>ShopKart brings everyday essentials together in one place: electronics, fashion, home, kitchen, beauty and more. We focus on products people actually use, and we try to make buying them simple.</p>
          <p>That means GST-inclusive prices, tax invoices with every order, and checkout that says exactly what you will pay.</p>
        </Prose>
        <aside className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-950 via-red-950 to-primary p-6 text-white shadow-lg">
          <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 -z-10 size-36 rounded-full bg-white/10" />
          <h2 className="text-lg font-semibold">Our promise to you</h2>
          <ul className="mt-4 grid gap-3 text-sm">
            {promises.map((p) => <li key={p} className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />{p}</li>)}
          </ul>
        </aside>
      </div>

      <section aria-labelledby="values">
        <h2 id="values" className="section-title mb-4">What we stand for</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ icon: Icon, title, text, tone }) => (
            <li key={title} className="group rounded-2xl border bg-card p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg">
              <span className={`mb-4 grid size-12 place-items-center rounded-xl bg-gradient-to-br ${tone} transition-transform duration-300 group-hover:scale-110`}><Icon className="size-6" aria-hidden="true" /></span>
              <p className="font-semibold">{title}</p><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <CtaBand title="Questions? We're happy to help." text="Browse the help centre or talk to a real person. We usually reply within a working day." primary={{ href: "/contact", label: "Contact us" }} secondary={{ href: "/help", label: "Visit the help centre" }} />
    </InfoPage>
  )
}
