"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BadgeCheck, Check, MessageSquare, Trash2, X } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { Stars } from "@/components/store/stars"
import { adminApi, failureMessage } from "@/features/admin/api"
import { fmtDate } from "@/features/admin/format"
import type { AdminReview as UserReview, ReviewStatus } from "@/features/admin/types"

const TABS: { value: ReviewStatus; label: string }[] = [{ value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" }]
const tone = { pending: "warn", approved: "good", rejected: "bad" } as const

export function ReviewsView({ reviews }: { reviews: UserReview[] }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  // Approving or un-approving also updates the product's rating totals, in one transaction on the server.
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError("")
    try { await fn(); router.refresh() } catch (e) { setError(failureMessage(e)) } finally { setBusy(false) }
  }
  const setStatus = (id: string, status: ReviewStatus) => run(() => adminApi(`admin/reviews/${id}`, { method: "PATCH", body: { status } }))
  const remove = (id: string) => run(() => adminApi(`admin/reviews/${id}`, { method: "DELETE" }))
  const [tab, setTab] = useState<ReviewStatus>("pending")
  const [removing, setRemoving] = useState<UserReview | null>(null)
  const count = (s: ReviewStatus) => reviews.filter((r) => r.status === s).length
  const list = reviews.filter((r) => r.status === tab)
  const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"

  return (
    <>
      <PageHeader title="Reviews" description="Check what shoppers write before it appears on the product page. Approved reviews count toward the product's rating." />
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}
      <ul aria-label="Review summary" className="grid gap-3 sm:grid-cols-3">
        {TABS.map((t) => <li key={t.value} className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">{t.label}</p><p className="price mt-1 text-2xl font-bold">{count(t.value)}</p></li>)}
      </ul>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div role="tablist" aria-label="Review status" className="flex gap-1 border-b px-3 pt-2">
          {TABS.map((t) => (
            <button key={t.value} role="tab" aria-selected={tab === t.value} onClick={() => setTab(t.value)} className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium ${tab === t.value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}<span className={`rounded-full px-2 py-0.5 text-xs ${tab === t.value ? "bg-primary/10" : "bg-muted"}`}>{count(t.value)}</span>
            </button>
          ))}
        </div>
        {list.length === 0 ? (
          <div className="grid justify-items-center gap-2 px-6 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><MessageSquare className="size-6" aria-hidden="true" /></span>
            <p className="font-semibold">{tab === "pending" ? "Nothing waiting for review" : `No ${tab} reviews`}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{tab === "pending" ? "When a shopper submits a review on a product page, it appears here for approval." : "Reviews you move here are listed for reference."}</p>
          </div>
        ) : (
          <ul className="divide-y">
            {list.map((r) => { return (
              <li key={r.id} className="grid gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm"><Link href={`/products/${r.productSlug}#reviews`} className="font-semibold hover:text-primary hover:underline">{r.productTitle}</Link><StatusBadge tone={tone[r.status]}>{r.status[0].toUpperCase() + r.status.slice(1)}</StatusBadge></p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span>{r.name}</span><span>{fmtDate(r.date)}</span>{r.verified ? <span className="inline-flex items-center gap-1 text-emerald-700"><BadgeCheck className="size-3.5" aria-hidden="true" /> Verified purchase</span> : <span>Not a verified purchase</span>}</p>
                  </div>
                  <Stars value={r.rating} />
                </div>
                <div><p className="font-medium">{r.title}</p><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{r.body}</p></div>
                <div className="flex flex-wrap gap-2">
                  {r.status !== "approved" && <button disabled={busy} onClick={() => void setStatus(r.id, "approved")} className={`${btn} border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}><Check className="size-3.5" aria-hidden="true" /> Approve</button>}
                  {r.status !== "rejected" && <button disabled={busy} onClick={() => void setStatus(r.id, "rejected")} className={`${btn} hover:bg-muted`}><X className="size-3.5" aria-hidden="true" /> Reject</button>}
                  <button onClick={() => setRemoving(r)} className={`${btn} text-destructive hover:bg-destructive/5`}><Trash2 className="size-3.5" aria-hidden="true" /> Delete</button>
                </div>
              </li>) })}
          </ul>
        )}
      </div>
      <ConfirmDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)} title="Delete this review?" description={`"${removing?.title}" by ${removing?.name} on ${removing ? removing.productTitle : ""} will be removed for good.`} confirmLabel="Delete review" onConfirm={() => { if (removing) void remove(removing.id) }} />
    </>
  )
}
