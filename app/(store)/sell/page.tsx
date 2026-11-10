import type { Metadata } from "next"
import { CheckCircle2, ClipboardList, Handshake, Rocket, Store } from "lucide-react"
import { DemoForm } from "@/components/info/demo-form"
import { DraftNotice, InfoPage } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Sell on ShopKart", description: "Interested in selling on ShopKart? Tell us about your business and products.", alternates: { canonical: "/sell" } }

const looks = ["Genuine products with invoices and warranty", "GST registration where applicable", "Reliable dispatch within one working day"]
const steps = [{ icon: ClipboardList, title: "Tell us about you", text: "Share your business and what you sell." }, { icon: Handshake, title: "We get in touch", text: "We review it and reply within a few working days." }, { icon: Rocket, title: "Start selling", text: "Agree the terms and list your first products." }]

export default function SellPage() {
  return (
    <InfoPage title="Sell on ShopKart" intro="Tell us what you sell and we'll be in touch." eyebrow="For sellers" icon={Store} trail={[{ label: "About", href: "/about" }]} wide>
      <DraftNotice>ShopKart is a single-merchant store today. This form shows how a seller enquiry page would look.</DraftNotice>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="enquiry" className="rounded-3xl border bg-card p-5 shadow-sm sm:p-8">
          <h2 id="enquiry" className="section-title">Seller enquiry</h2>
          <p className="mb-6 mt-1.5 text-sm text-muted-foreground">A few details help us point you to the right person.</p>
          <DemoForm submitLabel="Send enquiry" notice="Seller enquiries aren't connected yet. Email sellers@shopkart.example instead."
            fields={[
              { name: "business", label: "Business name", required: true, half: true },
              { name: "contact", label: "Contact person", required: true, half: true, autoComplete: "name" },
              { name: "email", label: "Email", type: "email", required: true, half: true, autoComplete: "email" },
              { name: "phone", label: "Mobile", type: "tel", required: true, half: true, autoComplete: "tel" },
              { name: "category", label: "Main category", type: "select", options: ["Electronics", "Fashion", "Home & Living", "Kitchen & Dining", "Beauty", "Other"], required: true },
              { name: "about", label: "What do you sell?", type: "textarea", required: true },
            ]} />
        </section>
        <div className="grid gap-4">
          <aside className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-red-950 to-primary p-6 text-white shadow-lg">
            <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 -z-10 size-36 rounded-full bg-white/10" />
            <h2 className="text-lg font-semibold">What we look for</h2>
            <ul className="mt-4 grid gap-3 text-sm">{looks.map((l) => <li key={l} className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-300" aria-hidden="true" />{l}</li>)}</ul>
          </aside>
          <section aria-labelledby="how" className="rounded-3xl border bg-card p-5 shadow-xs">
            <h2 id="how" className="mb-4 font-semibold">How it works</h2>
            <ol className="grid gap-4">
              {steps.map(({ icon: Icon, title, text }, i) => (
                <li key={title} className="flex gap-3.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
                  <span className="grid"><span className="text-sm font-semibold"><span className="text-primary">{i + 1}.</span> {title}</span><span className="text-sm text-muted-foreground">{text}</span></span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </InfoPage>
  )
}
