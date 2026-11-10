import type { ReactNode } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export type Column<T> = {
  header: string
  cell: (row: T) => ReactNode
  align?: "right"
  className?: string
}

/** Table that scrolls inside its own region and shows a designed empty state. */
export function SimpleTable<T>({ rows, columns, caption, empty, rowKey }: {
  rows: T[]
  columns: Column<T>[]
  caption: string
  empty: string
  rowKey: (row: T) => string
}) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-xl border bg-card">
      <Table>
        <TableCaption>{caption}</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((c, i) => (
              <TableHead key={`${i}-${c.header}`} className={c.align === "right" ? "text-right" : undefined}>{c.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={columns.length} className="py-10 text-center">{empty}</TableCell></TableRow>
          ) : rows.map((row) => (
            <TableRow key={rowKey(row)}>
              {columns.map((c, i) => (
                <TableCell key={`${i}-${c.header}`} className={`${c.align === "right" ? "price text-right" : ""} ${c.className ?? ""}`}>{c.cell(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
