import type { Metadata } from "next"
import { FileText } from "lucide-react"
import Link from "next/link"
import { DraftNotice, InfoPage, Prose, HelpAside } from "@/components/info/info-page"
import { policy } from "@/features/help/content"

export const metadata: Metadata = { title: "Terms & conditions", description: "The terms that apply when you browse and buy from ShopKart.", alternates: { canonical: "/terms" } }

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Legal" icon={FileText} aside={<HelpAside />} title="Terms & conditions" intro="Last updated 10 November 2026.">
      <DraftNotice>Starter text for the demo store, not legal advice. Have a lawyer review and adapt it before you accept real orders.</DraftNotice>
      <Prose title="Using the store"><p>By browsing or buying from ShopKart you agree to these terms. You must give accurate details at checkout and be legally able to enter a contract.</p></Prose>
      <Prose title="Prices and payment"><p>Prices are in Indian rupees and include GST unless stated. We may correct pricing errors before dispatch and will tell you if that happens. Payments are processed by Razorpay; we do not store card or UPI details.</p></Prose>
      <Prose title="Delivery"><p>Delivery is free above {policy.freeDelivery}; otherwise a flat {policy.shippingFee} fee applies. Timings are estimates. See <Link href="/help/shipping" className="text-primary underline">delivery information</Link>.</p></Prose>
      <Prose title="Returns and refunds"><p>You may return eligible items within {policy.returnDays} days of delivery. See <Link href="/help/returns" className="text-primary underline">returns &amp; refunds</Link>.</p></Prose>
      <Prose title="Contact"><p>Questions about these terms? <Link href="/contact" className="text-primary underline">Contact us</Link>.</p></Prose>
    </InfoPage>
  )
}
