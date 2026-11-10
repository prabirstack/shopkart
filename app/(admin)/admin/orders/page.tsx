import { DemoNotice } from "@/components/admin/demo-notice"
import { OrderTable } from "@/components/admin/order-table"
import { PageHeader } from "@/components/admin/page-header"
import { recentOrders } from "@/features/admin/demo"

export default function AdminOrdersPage() {
  return (
    <>
      <PageHeader title="Orders" description="Every order and where it is in fulfillment." />
      <DemoNotice />
      <OrderTable rows={recentOrders} caption="Orders, newest first." />
    </>
  )
}
