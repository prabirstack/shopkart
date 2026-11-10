import type { Metadata } from "next"
import Link from "next/link"
import { DraftNotice, InfoPage, Prose } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Privacy policy", description: "What personal data ShopKart collects, why, and how you can control it.", alternates: { canonical: "/privacy" } }

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy policy" intro="Last updated 10 November 2026.">
      <DraftNotice>Starter text for the demo store, not legal advice. Have it reviewed against applicable Indian law (including the DPDP Act) before launch.</DraftNotice>
      <Prose title="What we collect"><ul><li>Details you give us: name, email, mobile number, delivery address.</li><li>Order and payment status (not your card or UPI details).</li><li>Optional analytics about how the site is used, only if you accept.</li></ul></Prose>
      <Prose title="Why we use it"><p>To process and deliver orders, send receipts and invoices, handle returns and support, prevent fraud, and meet legal duties such as tax records. We send marketing email only with your separate consent.</p></Prose>
      <Prose title="Who we share it with"><p>Payment processor (Razorpay), delivery partners and email providers, only as needed to serve you. We do not sell personal data.</p></Prose>
      <Prose title="Your choices"><p>You can access, correct or delete your data and withdraw consent by <Link href="/contact" className="text-primary underline">contacting us</Link>. Manage analytics in the <Link href="/cookies" className="text-primary underline">cookie policy</Link>.</p></Prose>
    </InfoPage>
  )
}
