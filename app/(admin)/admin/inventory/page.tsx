import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { available, inventory } from "@/features/admin/demo"

export default function AdminInventoryPage() {
  return (
    <>
      <PageHeader title="Inventory" description="Available = on hand minus reserved." />
      <DemoNotice />
      <div className="min-w-0 overflow-x-auto rounded-xl border bg-card">
        <Table>
          <TableCaption>Stock changes will be recorded as movements, never typed over.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead><TableHead>SKU</TableHead>
              <TableHead className="text-right">On hand</TableHead><TableHead className="text-right">Reserved</TableHead>
              <TableHead className="text-right">Available</TableHead><TableHead>Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((r) => {
              const left = available(r)
              return (
                <TableRow key={r.sku}>
                  <TableCell className="min-w-48 font-medium">{r.title}</TableCell>
                  <TableCell className="font-mono text-xs">{r.sku}</TableCell>
                  <TableCell className="price text-right">{r.onHand}</TableCell>
                  <TableCell className="price text-right">{r.reserved}</TableCell>
                  <TableCell className="price text-right font-medium">{left}</TableCell>
                  <TableCell>
                    {left === 0 ? <Badge variant="destructive">Out of stock</Badge>
                      : left <= r.reorderAt ? <Badge variant="secondary" className="bg-amber-100 text-amber-800">Low</Badge>
                      : <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Healthy</Badge>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
