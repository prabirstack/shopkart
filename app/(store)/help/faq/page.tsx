import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, HelpCircle } from "lucide-react"
import { FaqAccordion } from "@/components/info/faq-accordion"
import { InfoPage } from "@/components/info/info-page"
import { JsonLd } from "@/components/json-ld"
import { faqs } from "@/features/help/content"

export const metadata: Metadata = { title: "Frequently asked questions", description: "Answers about orders, delivery, returns, payments, GST invoices and your ShopKart account.", alternates: { canonical: "/help/faq" } }

const slug = (topic: string) => `faq-${topic.toLowerCase().replace(/\W+/g, "-")}`

export default function FaqPage() {
  const topics = [...new Set(faqs.map((f) => f.topic))]
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
  return (
    <InfoPage title="Frequently asked questions" intro="Quick answers about orders, delivery, returns and payments." eyebrow="Help centre" icon={HelpCircle} trail={[{ label: "Help", href: "/help" }]} wide>
      <JsonLd data={ld} />
      <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="grid gap-4 lg:sticky lg:top-4">
          <nav aria-label="FAQ topics" className="rounded-2xl border bg-card p-3 shadow-xs">
            <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jump to</p>
            <ul className="flex flex-wrap gap-2 lg:grid lg:gap-1">
              {topics.map((t) => (
                <li key={t}>
                  <a href={`#${slug(t)}`} className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:border-transparent lg:bg-transparent lg:py-2.5">
                    {t}<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{faqs.filter((f) => f.topic === t).length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground shadow-md shadow-primary/20 lg:block">
            <p className="font-semibold">Still stuck?</p>
            <p className="mt-1 text-sm text-primary-foreground/85">A real person replies within one working day.</p>
            <Link href="/contact" className="group mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary">Contact us<ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>
          </div>
        </aside>
        <div className="grid gap-8">
          {topics.map((topic) => (
            <section key={topic} id={slug(topic)} aria-labelledby={`${slug(topic)}-h`} className="grid scroll-mt-24 gap-3">
              <h2 id={`${slug(topic)}-h`} className="section-title flex items-center gap-3 before:h-6 before:w-1 before:rounded-full before:bg-primary">{topic}</h2>
              <FaqAccordion items={faqs.filter((f) => f.topic === topic)} idPrefix={slug(topic)} />
            </section>
          ))}
        </div>
      </div>
    </InfoPage>
  )
}
