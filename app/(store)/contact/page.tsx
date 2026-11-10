import type { Metadata } from "next"
import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { DemoForm } from "@/components/info/demo-form"
import { InfoPage } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Contact us", description: "Get in touch with ShopKart support about orders, returns, payments or anything else.", alternates: { canonical: "/contact" } }

export default function ContactPage() {
  return (
    <InfoPage title="Contact us" intro="We usually reply within one working day." wide>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="msg" className="rounded-xl border bg-card p-5">
          <h2 id="msg" className="mb-4 font-semibold">Send a message</h2>
          <DemoForm submitLabel="Send message" notice="Messages aren't connected yet. Email us directly using the details beside this form."
            fields={[
              { name: "name", label: "Your name", required: true, half: true, autoComplete: "name" },
              { name: "email", label: "Email", type: "email", required: true, half: true, autoComplete: "email" },
              { name: "topic", label: "Topic", type: "select", required: true, options: ["Order status", "Returns & refunds", "Payments & invoices", "Product question", "Something else"] },
              { name: "order", label: "Order number (optional)", hint: "For example SK-10482" },
              { name: "message", label: "How can we help?", type: "textarea", required: true },
            ]} />
        </section>
        <aside className="grid gap-3 rounded-xl border bg-card p-5 text-sm">
          <h2 className="font-semibold">Other ways to reach us</h2>
          <p className="flex items-start gap-3"><Mail className="mt-0.5 size-4 text-primary" aria-hidden="true" /><span>support@shopkart.example</span></p>
          <p className="flex items-start gap-3"><Phone className="mt-0.5 size-4 text-primary" aria-hidden="true" /><span>1800-000-0000 (sample number)</span></p>
          <p className="flex items-start gap-3"><Clock className="mt-0.5 size-4 text-primary" aria-hidden="true" /><span>Mon to Sat, 9am to 6pm IST</span></p>
          <p className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 text-primary" aria-hidden="true" /><span>ShopKart, Bengaluru, Karnataka (sample address)</span></p>
        </aside>
      </div>
    </InfoPage>
  )
}
