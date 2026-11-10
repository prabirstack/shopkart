import type { Metadata } from "next"
import { InfoPage } from "@/components/info/info-page"
import { TrackForm } from "@/features/help/track-form"

export const metadata: Metadata = { title: "Track your order", description: "Enter your order number and email to see the delivery status of your ShopKart order.", alternates: { canonical: "/help/track-order" } }

export default function TrackOrderPage() {
  return (
    <InfoPage title="Track your order" intro="Enter the order number from your confirmation email." trail={[{ label: "Help", href: "/help" }]}>
      <TrackForm />
    </InfoPage>
  )
}
