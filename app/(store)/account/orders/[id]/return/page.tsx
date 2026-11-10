import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { ReturnForm } from "@/components/account/return-form"
import { StoreBreadcrumbs } from "@/components/store/breadcrumbs"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/features/account/orders"
import { requireUser } from "@/features/account/session"
import { DomainError, getReturnEligibility } from "@/lib/db/queries"

export const instant = false

async function ReturnPage({ params }: { params: PageProps<"/account/orders/[id]/return">["params"] }) {
  const { id } = await params
  const user = await requireUser(`/account/orders/${id}/return`)
  // Ownership is part of the query: someone else's order number is simply "not found".
  const el = await getReturnEligibility(id, user.id).catch((e) => { if (e instanceof DomainError && e.code === "NOT_FOUND") notFound(); throw e })
  return (
    <>
      <StoreBreadcrumbs trail={[{ label: "Account", href: "/account" }, { label: "Orders", href: "/account/orders" }, { label: id, href: `/account/orders/${id}` }, { label: "Return items" }]} />
      <div><h1 className="store-title !text-3xl">Return items from {id}</h1>
        {el.eligible && el.deadline && <p className="mt-1 text-sm text-muted-foreground">Returns are accepted for {el.windowDays} days after delivery. Yours closes on {formatDate(el.deadline)}.</p>}</div>
      {el.eligible
        ? <ReturnForm orderNumber={id} lines={el.lines} deadline={el.deadline?.toISOString() ?? null} />
        : <section aria-labelledby="no" className="grid gap-3 rounded-xl border bg-card p-6"><h2 id="no" className="font-semibold">This order can&apos;t be returned</h2><p role="status" className="text-sm text-muted-foreground">{el.reason}</p>
            <div><Link href={`/account/orders/${id}`} className={buttonVariants({ variant: "outline" })}>Back to order</Link></div></section>}
    </>
  )
}

export default function Page({ params }: PageProps<"/account/orders/[id]/return">) {
  return <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}><ReturnPage params={params} /></Suspense>
}
