import type { Metadata } from "next"
import { Leaf } from "lucide-react"
import { DraftNotice, InfoPage, Prose, HelpAside } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Sustainability", description: "How ShopKart thinks about packaging, delivery and product longevity.", alternates: { canonical: "/sustainability" } }

export default function SustainabilityPage() {
  return (
    <InfoPage eyebrow="Our approach" icon={Leaf} aside={<HelpAside />} title="Sustainability" intro="Small choices in packaging and delivery add up." trail={[{ label: "About", href: "/about" }]}>
      <DraftNotice>Starter text describing intentions. Only publish commitments you can measure and keep.</DraftNotice>
      <Prose title="Packaging"><p>We aim to use right-sized boxes and recyclable fillers, and to avoid single-use plastic where a safe alternative exists.</p></Prose>
      <Prose title="Delivery"><p>Bundling items into fewer parcels and offering free delivery thresholds encourages fuller, fewer shipments.</p></Prose>
      <Prose title="Products that last"><p>We favour products with clear warranties and support repairs and returns of faulty items instead of replacement by default.</p></Prose>
    </InfoPage>
  )
}
