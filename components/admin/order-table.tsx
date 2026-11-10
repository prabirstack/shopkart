import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney } from "@/lib/money"
import type { AdminOrderRow } from "@/features/admin/demo"
import { OrderStatusBadge } from "./order-status-badge"

export function OrderTable({ rows, caption }: { rows: AdminOrderRow[]; caption: string }) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableCaption>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead><TableHead>Customer</TableHead><TableHead>Placed</TableHead>
            <TableHead className="text-right">Items</TableHead><TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center">No orders yet.</TableCell></TableRow>
          ) : rows.map((o) => (
            <TableRow key={o.id}>
              <TableCell className="font-mono text-xs">{o.id}</TableCell>
              <TableCell>{o.customer}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{o.placed}</TableCell>
              <TableCell className="text-right">{o.items}</TableCell>
              <TableCell className="price whitespace-nowrap text-right">{formatMoney(o.totalPaise, undefined, undefined, { hideZeroDecimals: true })}</TableCell>
              <TableCell><OrderStatusBadge status={o.status} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
