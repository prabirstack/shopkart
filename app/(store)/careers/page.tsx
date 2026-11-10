import type { Metadata } from "next"
import { DraftNotice, InfoPage } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Careers", description: "Join ShopKart. See open roles in engineering, operations, customer support and merchandising.", alternates: { canonical: "/careers" } }

const roles = [
  { title: "Frontend Engineer", team: "Engineering", where: "Bengaluru or Remote", type: "Full time" },
  { title: "Backend Engineer", team: "Engineering", where: "Bengaluru or Remote", type: "Full time" },
  { title: "Catalogue Executive", team: "Merchandising", where: "Bengaluru", type: "Full time" },
  { title: "Customer Support Associate", team: "Support", where: "Bengaluru", type: "Full time" },
]

export default function CareersPage() {
  return (
    <InfoPage title="Careers" intro="Help us make online shopping simpler and more honest." trail={[{ label: "About", href: "/about" }]}>
      <DraftNotice>Sample roles for the demo store. These are not real openings.</DraftNotice>
      <ul className="grid gap-3">{roles.map((r) => (
        <li key={r.title} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-5">
          <div><p className="font-semibold">{r.title}</p><p className="text-sm text-muted-foreground">{r.team} · {r.where} · {r.type}</p></div>
          <a href={`mailto:careers@shopkart.example?subject=${encodeURIComponent(`Application: ${r.title}`)}`} className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">Apply by email</a>
        </li>))}</ul>
    </InfoPage>
  )
}
