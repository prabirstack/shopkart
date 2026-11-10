import type { Metadata } from "next"
import { DraftNotice, InfoPage, Prose } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Press", description: "Press contact and brand guidelines for ShopKart.", alternates: { canonical: "/press" } }

export default function PressPage() {
  return (
    <InfoPage title="Press" intro="Writing about ShopKart? Here is how to reach us." trail={[{ label: "About", href: "/about" }]}>
      <DraftNotice>Starter text for the demo store.</DraftNotice>
      <Prose title="Press enquiries"><p>Email <a className="text-primary underline" href="mailto:press@shopkart.example">press@shopkart.example</a>. We reply within two working days.</p></Prose>
      <Prose title="Brand basics"><ul><li>Write the name as <strong>ShopKart</strong>, one word, capital S and K.</li><li>Our brand colour is crimson red on white.</li><li>Please do not alter or recolour the logo.</li></ul></Prose>
    </InfoPage>
  )
}
