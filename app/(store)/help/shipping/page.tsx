import type { Metadata } from "next"
import { Truck } from "lucide-react"
import { DraftNotice, InfoPage, Prose, HelpAside } from "@/components/info/info-page"
import { policy } from "@/features/help/content"

export const metadata: Metadata = { title: "Delivery information", description: `Free delivery above ${policy.freeDelivery}. Learn about delivery fees, timing and tracking.`, alternates: { canonical: "/help/shipping" } }

export default function ShippingPage() {
  return (
    <InfoPage eyebrow="Delivery" icon={Truck} aside={<HelpAside />} title="Delivery information" intro={`Free delivery on orders above ${policy.freeDelivery}.`} trail={[{ label: "Help", href: "/help" }]}>
      <DraftNotice>Starter policy text for the demo store. Confirm timings and coverage with your courier partners.</DraftNotice>
      <Prose title="Delivery fees"><ul><li>Orders above <strong>{policy.freeDelivery}</strong>: free.</li><li>Orders below that: flat <strong>{policy.shippingFee}</strong>.</li></ul><p>The fee is shown in your cart and again at checkout, so there are no surprises.</p></Prose>
      <Prose title="How long it takes"><p>Orders are packed within 1 working day. Delivery then takes about <strong>3 to 5 working days</strong> for most pin codes, and a little longer for remote areas.</p></Prose>
      <Prose title="Tracking"><p>Once your parcel ships you can follow it from <a href="/help/track-order" className="text-primary underline">Track your order</a> or under Account, Orders.</p></Prose>
    </InfoPage>
  )
}
