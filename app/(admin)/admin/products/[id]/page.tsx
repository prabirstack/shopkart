import { notFound } from "next/navigation"
import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { adminProducts } from "@/features/admin/demo"

export const instant = false
export function generateStaticParams() { return adminProducts.map((p) => ({ id: p.id })) }

const input = "h-10 w-full rounded-lg border bg-muted/40 px-3 text-sm"

export default async function AdminProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params
  const p = adminProducts.find((x) => x.id === id)
  if (!p) notFound()
  const fields: [string, string, string][] = [["title", "Title", p.title], ["sku", "SKU", p.sku], ["category", "Category", p.category], ["price", "Price (₹)", String(p.pricePaise / 100)], ["gst", "GST rate (%)", String(p.gstPercent)], ["stock", "Available stock", String(p.available)]]
  return (
    <>
      <PageHeader title={p.title} description={p.published ? "Published on the storefront." : "Draft: not visible to customers."} />
      <DemoNotice />
      <form className="grid max-w-2xl gap-4 rounded-xl border bg-card p-5 sm:grid-cols-2" aria-describedby="note">
        {fields.map(([id, label, value]) => (
          <div key={id} className="grid gap-1.5"><label htmlFor={id} className="text-sm font-medium">{label}</label><input id={id} defaultValue={value} readOnly className={input} /></div>
        ))}
        <p id="note" className="text-xs text-muted-foreground sm:col-span-2">Editing is added in the catalog chapter, with permission checks and version conflict handling.</p>
        <div className="flex gap-2 sm:col-span-2"><Button type="button" disabled>Save changes</Button><Button type="button" variant="outline" disabled>{p.published ? "Unpublish" : "Publish"}</Button></div>
      </form>
    </>
  )
}
