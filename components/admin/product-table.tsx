import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatMoney } from "@/lib/money"
import type { AdminProductRow } from "@/features/admin/demo"

export function AdminProductTable({ rows }: { rows: AdminProductRow[] }) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableCaption>Prices are displayed in INR and include GST where shown.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead><TableHead>SKU</TableHead><TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead><TableHead className="text-right">GST</TableHead>
            <TableHead className="text-right">Available</TableHead><TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="py-10 text-center">No products match these filters.</TableCell></TableRow>
          ) : rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="min-w-48 font-medium"><Link href={`/admin/products/${p.id}`} className="hover:text-primary hover:underline">{p.title}</Link></TableCell>
              <TableCell className="font-mono text-xs">{p.sku}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">{p.category}</TableCell>
              <TableCell className="price whitespace-nowrap text-right">{formatMoney(p.pricePaise, undefined, undefined, { hideZeroDecimals: true })}</TableCell>
              <TableCell className="price text-right">{p.gstPercent}%</TableCell>
              <TableCell className="price text-right">
                {p.available === 0 ? <span className="font-medium text-destructive">Out of stock</span> : p.available}
              </TableCell>
              <TableCell>
                <Badge variant={p.published ? "default" : "secondary"}>{p.published ? "Published" : "Draft"}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
