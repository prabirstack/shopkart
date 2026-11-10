import type { Metadata } from "next"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { CookieSettingsButton } from "@/features/analytics/cookie-settings-button"

export const metadata: Metadata = { title: "Cookie policy", description: "How ShopKart uses essential and optional analytics cookies, and how to change your choice.", alternates: { canonical: "/cookies" } }

const rows = [
  { name: "Cart and wishlist (localStorage)", purpose: "Remembers the items you add so your cart survives a refresh.", type: "Essential", note: "Stored only in your browser." },
  { name: "Recent searches (localStorage)", purpose: "Shows your last few searches in the search box.", type: "Essential", note: "Stored only in your browser." },
  { name: "Consent choice (localStorage)", purpose: "Remembers whether you accepted analytics.", type: "Essential", note: "Stored only in your browser." },
  { name: "Order confirmation cookie", purpose: "Lets the thank-you page show your latest order for one hour.", type: "Essential", note: "Signed, httpOnly." },
  { name: "Google Analytics (_ga, _ga_*)", purpose: "Counts visits and shows which products and pages people use.", type: "Optional", note: "Only set if you accept, and only when analytics is configured." },
]

export default function CookiesPage() {
  return (
    <main className="store-container grid grid-cols-[minmax(0,1fr)] gap-5 py-6">
      <StoreBreadcrumbs trail={[{ label: "Cookie policy" }]} />
      <h1 className="store-title !text-3xl">Cookie policy</h1>
      <div className="article-copy grid gap-4 text-muted-foreground">
        <p>We use a small number of essential items to make the store work, and optional analytics only with your consent. Declining analytics never affects shopping or checkout.</p>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Starter text for the demo store. Have your final policy reviewed before launch.</p>
      </div>
      <div className="min-w-0 overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Cookies and similar storage used by ShopKart</caption>
          <thead><tr className="border-b bg-muted/40"><th className="p-3 font-medium">Name</th><th className="p-3 font-medium">Purpose</th><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Notes</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.name} className="border-b last:border-0"><td className="p-3 font-medium">{r.name}</td><td className="p-3 text-muted-foreground">{r.purpose}</td><td className="p-3">{r.type}</td><td className="p-3 text-muted-foreground">{r.note}</td></tr>)}</tbody>
        </table>
      </div>
      <div><CookieSettingsButton /></div>
    </main>
  )
}
