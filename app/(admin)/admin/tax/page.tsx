import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { SimpleTable } from "@/components/admin/simple-table"
import { taxCategories } from "@/features/admin/demo"
import { formatMoney, gstFromInclusive } from "@/lib/money"

const rupees = (p: number) => formatMoney(p, undefined, undefined, { hideZeroDecimals: true })

export default function AdminTaxPage() {
  // Worked example with a tax-inclusive price of ₹1,180 at 18% GST.
  const price = 118000
  const rate = 18
  const gst = gstFromInclusive(price, rate)
  return (
    <>
      <PageHeader title="Tax (GST)" description="Every product points to one tax category. Prices shown to customers include GST." />
      <DemoNotice />
      <section aria-labelledby="example" className="rounded-xl border bg-card p-4">
        <h2 id="example" className="font-semibold">Worked example</h2>
        <p className="mt-1 text-sm text-muted-foreground">A tax-inclusive price of {rupees(price)} at {rate}% GST splits like this:</p>
        <dl className="price mt-3 grid max-w-sm grid-cols-2 gap-y-1 text-sm">
          <dt>Price before GST</dt><dd className="text-right">{rupees(price - gst)}</dd>
          <dt>GST ({rate}%)</dt><dd className="text-right">{rupees(gst)}</dd>
          <dt className="font-semibold">Customer pays</dt><dd className="text-right font-semibold">{rupees(price)}</dd>
        </dl>
      </section>
      <SimpleTable rows={taxCategories} rowKey={(t) => t.id} caption="GST categories. Rates are examples; confirm real rates with your accountant." empty="No tax categories."
        columns={[
          { header: "Category", cell: (t) => t.name, className: "min-w-52 font-medium" },
          { header: "HSN", cell: (t) => <span className="font-mono text-xs">{t.hsn}</span> },
          { header: "GST rate", align: "right", cell: (t) => `${t.ratePercent}%` },
          { header: "Products", align: "right", cell: (t) => t.products },
        ]} />
    </>
  )
}
