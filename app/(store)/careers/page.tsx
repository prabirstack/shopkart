import type { Metadata } from "next"
import { ArrowUpRight, Briefcase, Coffee, HeartPulse, Laptop, MapPin, Rocket } from "lucide-react"
import { DraftNotice, InfoPage } from "@/components/info/info-page"

export const metadata: Metadata = { title: "Careers", description: "Join ShopKart. See open roles in engineering, operations, customer support and merchandising.", alternates: { canonical: "/careers" } }

const roles = [
  { title: "Frontend Engineer", team: "Engineering", where: "Bengaluru or Remote", type: "Full time" },
  { title: "Backend Engineer", team: "Engineering", where: "Bengaluru or Remote", type: "Full time" },
  { title: "Catalogue Executive", team: "Merchandising", where: "Bengaluru", type: "Full time" },
  { title: "Customer Support Associate", team: "Support", where: "Bengaluru", type: "Full time" },
]
const teamTone: Record<string, string> = { Engineering: "bg-sky-100 text-sky-800", Merchandising: "bg-violet-100 text-violet-800", Support: "bg-emerald-100 text-emerald-800" }
const perks = [{ icon: Laptop, text: "Flexible, remote-friendly work" }, { icon: HeartPulse, text: "Health cover for you and your family" }, { icon: Coffee, text: "Learning budget and protected focus time" }, { icon: Rocket, text: "Real ownership from your first month" }]

export default function CareersPage() {
  return (
    <InfoPage eyebrow="Join the team" icon={Briefcase} title="Careers" intro="Help us make online shopping simpler and more honest." trail={[{ label: "About", href: "/about" }]} wide>
      <DraftNotice>Sample roles for the demo store. These are not real openings.</DraftNotice>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="roles" className="grid gap-3">
          <h2 id="roles" className="section-title flex items-center gap-3 before:h-6 before:w-1 before:rounded-full before:bg-primary">Open roles <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium text-muted-foreground">{roles.length}</span></h2>
          <ul className="grid gap-3">{roles.map((r) => (
            <li key={r.title}>
              <a href={`mailto:careers@shopkart.example?subject=${encodeURIComponent(`Application: ${r.title}`)}`} className="group flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg focus-visible:ring-[3px] focus-visible:ring-ring/50">
                <span className="grid gap-2">
                  <span className="font-semibold">{r.title}</span>
                  <span className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${teamTone[r.team] ?? "bg-muted"}`}>{r.team}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden="true" />{r.where}</span><span>{r.type}</span>
                  </span>
                </span>
                <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border bg-background px-4 text-sm font-semibold transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">Apply by email<ArrowUpRight className="size-4" aria-hidden="true" /></span>
              </a>
            </li>))}</ul>
        </section>
        <aside className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-neutral-950 via-red-950 to-primary p-6 text-white shadow-lg lg:sticky lg:top-4">
          <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 -z-10 size-36 rounded-full bg-white/10" />
          <h2 className="text-lg font-semibold">Why ShopKart</h2>
          <ul className="mt-4 grid gap-3.5 text-sm">{perks.map(({ icon: Icon, text }) => <li key={text} className="flex items-center gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/10"><Icon className="size-4" aria-hidden="true" /></span>{text}</li>)}</ul>
        </aside>
      </div>
    </InfoPage>
  )
}
