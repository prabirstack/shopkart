import type { Metadata } from "next"
import { DemoForm } from "@/components/info/demo-form"
import { DraftNotice, InfoPage, Prose } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Sell on ShopKart", description: "Interested in selling on ShopKart? Tell us about your business and products.", alternates: { canonical: "/sell" } }

export default function SellPage() {
  return (
    <InfoPage title="Sell on ShopKart" intro="Tell us what you sell and we'll be in touch." trail={[{ label: "About", href: "/about" }]}>
      <DraftNotice>ShopKart is a single-merchant store today. This form shows how a seller enquiry page would look.</DraftNotice>
      <Prose title="What we look for"><ul><li>Genuine products with invoices and warranty.</li><li>GST registration where applicable.</li><li>Reliable dispatch within one working day.</li></ul></Prose>
      <section aria-labelledby="enquiry" className="rounded-xl border bg-card p-5"><h2 id="enquiry" className="mb-4 font-semibold">Seller enquiry</h2>
        <DemoForm submitLabel="Send enquiry" notice="Seller enquiries aren't connected yet. Email sellers@shopkart.example instead."
          fields={[
            { name: "business", label: "Business name", required: true, half: true },
            { name: "contact", label: "Contact person", required: true, half: true, autoComplete: "name" },
            { name: "email", label: "Email", type: "email", required: true, half: true, autoComplete: "email" },
            { name: "phone", label: "Mobile", type: "tel", required: true, half: true, autoComplete: "tel" },
            { name: "category", label: "Main category", type: "select", options: ["Electronics", "Fashion", "Home & Living", "Kitchen & Dining", "Beauty", "Other"], required: true },
            { name: "about", label: "What do you sell?", type: "textarea", required: true },
          ]} /></section>
    </InfoPage>
  )
}
