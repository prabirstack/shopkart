import { notFound } from "next/navigation"
import { Fragment } from "react"
import { DemoNotice } from "@/components/admin/demo-notice"
import { OrderStatusBadge } from "@/components/admin/order-status-badge"
import { PageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { recentOrders } from "@/features/admin/demo"
import { formatMoney } from "@/lib/money"

export const instant = false
export function generateStaticParams() { return recentOrders.map((o) => ({ id: o.id })) }

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params
  const order = recentOrders.find((o) => o.id === id)
  if (!order) notFound()
  const rows: [string, string][] = [["Customer", order.customer], ["Placed", order.placed], ["Items", String(order.items)], ["Total", formatMoney(order.totalPaise)]]
  return (
    <>
      <PageHeader title={`Order ${order.id}`} description="Review the order and move it through fulfilment."><OrderStatusBadge status={order.status} /></PageHeader>
      <DemoNotice />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="summary" className="rounded-xl border bg-card p-5">
          <h2 id="summary" className="mb-3 font-semibold">Summary</h2>
          <dl className="price grid grid-cols-[8rem_1fr] gap-y-2 text-sm">{rows.map(([k, v]) => (<Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></Fragment>))}</dl>
        </section>
        <aside aria-labelledby="actions" className="grid gap-3 rounded-xl border bg-card p-5">
          <h2 id="actions" className="font-semibold">Actions</h2>
          <Button disabled>Mark as packed</Button><Button variant="outline" disabled>Create shipment</Button><Button variant="outline" disabled>Issue refund</Button>
          <p className="text-xs text-muted-foreground">Fulfilment and refunds are added in the orders chapters. Refunds will need a separate permission.</p>
        </aside>
      </div>
    </>
  )
}
