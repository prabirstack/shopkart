import { Suspense } from "react"
import { Search } from "lucide-react"
import { DemoNotice } from "@/components/admin/demo-notice"
import { PageHeader } from "@/components/admin/page-header"
import { AdminProductTable } from "@/components/admin/product-table"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { adminProducts } from "@/features/admin/demo"

const statuses = ["all", "published", "draft"] as const
type Status = (typeof statuses)[number]

async function ProductsResults({ searchParams }: { searchParams: PageProps<"/admin/products">["searchParams"] }) {
  const sp = await searchParams
  const q = (typeof sp.q === "string" ? sp.q : "").trim().slice(0, 100)
  const status: Status = statuses.find((s) => s === sp.status) ?? "all"

  const rows = adminProducts.filter((p) =>
    (status === "all" || (status === "published") === p.published) &&
    (q === "" || `${p.title} ${p.sku}`.toLowerCase().includes(q.toLowerCase())))

  return (
    <>
      <form method="get" role="search" className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="q" className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input id="q" name="q" defaultValue={q} maxLength={100} placeholder="Title or SKU"
              className="h-9 w-64 max-w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40" />
          </div>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">Status</label>
          <select id="status" name="status" defaultValue={status}
            className="h-9 rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <option value="all">All</option><option value="published">Published</option><option value="draft">Draft</option>
          </select>
        </div>
        <Button type="submit">Apply</Button>
      </form>
      <p className="text-sm text-muted-foreground" role="status">{rows.length} of {adminProducts.length} products</p>
      <AdminProductTable rows={rows} />
    </>
  )
}

export default function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageHeader title="Products" description="Search and review the catalog.">
        <Button disabled title="Product editing arrives in the catalog chapter">Add product</Button>
      </PageHeader>
      <DemoNotice />
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ProductsResults searchParams={searchParams} />
      </Suspense>
    </>
  )
}
