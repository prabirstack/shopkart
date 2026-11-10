import type { Metadata } from "next"
import { Gift } from "lucide-react"
import { DraftNotice, InfoPage } from "@/components/info/info-page"
import { GiftCardForm } from "@/features/gift-cards/gift-card-form"

export const metadata: Metadata = { title: "Gift cards", description: "Give the gift of choice with a ShopKart gift card, delivered by email.", alternates: { canonical: "/gift-cards" } }

export default function GiftCardsPage() {
  return (
    <InfoPage eyebrow="Gifting" icon={Gift} title="Gift cards" intro="The easy present: pick an amount and we email it." wide>
      <DraftNotice>Layout preview. Gift cards can&apos;t be bought yet.</DraftNotice>
      <GiftCardForm />
    </InfoPage>
  )
}
