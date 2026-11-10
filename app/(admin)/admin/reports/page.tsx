import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { salesByCategory } from "@/features/admin/demo"
import { formatMoney } from "@/lib/money"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

export default function AdminReportsPage() {
  const max = Math.max(...salesByCategory.map((c) => c.paise))
  const total = salesByCategory.reduce((s, c) => s + c.paise, 0)
  return (
    <>
      <PageHeader title="Reports" description="Sales numbers that must reconcile with paid orders." />
      <DemoNotice />
      <section aria-labelledby="by-category" className="rounded-xl border bg-card p-4">
        <h2 id="by-category" className="font-semibold">Sales by category</h2>
        <p className="price mt-1 text-sm text-muted-foreground">Total {rupees(total)} in the sample period.</p>
        <ul className="mt-4 grid gap-3">
          {salesByCategory.map((c) => (
            <li key={c.name} className="grid grid-cols-[8rem_minmax(0,1fr)_6rem] items-center gap-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)_7rem]">
              <span className="truncate">{c.name}</span>
              <span className="h-3 rounded-full bg-muted" aria-hidden="true">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${(c.paise / max) * 100}%` }} />
              </span>
              <span className="price text-right font-medium">{rupees(c.paise)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
