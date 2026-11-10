import type { Metadata } from "next"
import { FaqAccordion } from "@/components/info/faq-accordion"
import { InfoPage } from "@/components/info/info-page"
import { JsonLd } from "@/components/json-ld"
import { faqs } from "@/features/help/content"

export const metadata: Metadata = { title: "Frequently asked questions", description: "Answers about orders, delivery, returns, payments, GST invoices and your ShopKart account.", alternates: { canonical: "/help/faq" } }

export default function FaqPage() {
  const topics = [...new Set(faqs.map((f) => f.topic))]
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }
  return (
    <InfoPage title="Frequently asked questions" intro="Can't find what you need? Contact us and we'll help." trail={[{ label: "Help", href: "/help" }]}>
      <JsonLd data={ld} />
      {topics.map((topic) => (
        <section key={topic} aria-labelledby={`faq-${topic}`} className="grid gap-2">
          <h2 id={`faq-${topic}`} className="section-title">{topic}</h2>
          <FaqAccordion items={faqs.filter((f) => f.topic === topic)} idPrefix={`faq-${topic}`} />
        </section>
      ))}
    </InfoPage>
  )
}
