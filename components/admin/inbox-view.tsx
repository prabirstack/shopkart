"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Download, Inbox, Mail, Trash2, Undo2, CheckCheck, Eye } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { adminApi, failureMessage } from "@/features/admin/api"
import { downloadCsv } from "@/features/admin/csv"
import { fmtDateTime } from "@/features/admin/format"
import type { AdminMessage, AdminSubscriber } from "@/lib/db/queries/inbox"

type Tab = "messages" | "subscribers"
type Filter = "all" | AdminMessage["status"]
const FILTERS: { value: Filter; label: string }[] = [{ value: "all", label: "All" }, { value: "new", label: "New" }, { value: "read", label: "Read" }, { value: "resolved", label: "Resolved" }]
const tone = { new: "warn", read: "muted", resolved: "good" } as const
const btn = "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-60"

export function InboxView({ messages, subscribers, canSeeSubscribers = true }: { messages: AdminMessage[]; subscribers: { items: AdminSubscriber[]; subscribed: number; total: number }; canSeeSubscribers?: boolean }) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("messages")
  const [filter, setFilter] = useState<Filter>("new")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [removing, setRemoving] = useState<AdminSubscriber | null>(null)
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError("")
    try { await fn(); router.refresh() } catch (e) { setError(failureMessage(e)) } finally { setBusy(false) }
  }
  const setStatus = (id: string, status: AdminMessage["status"]) => run(() => adminApi(`admin/inbox/messages/${id}`, { method: "PATCH", body: { status } }))
  const count = (f: Filter) => (f === "all" ? messages.length : messages.filter((m) => m.status === f).length)
  const list = messages.filter((m) => filter === "all" || m.status === filter)

  return (
    <>
      <PageHeader title="Inbox" description="Messages from the contact form, and people who signed up for the newsletter." />
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs">
        <div role="tablist" aria-label="Inbox sections" className="flex gap-1 border-b px-3 pt-2">
          {([["messages", "Messages", count("new")], ["subscribers", "Newsletter", subscribers.subscribed]] as const).filter(([v]) => v === "messages" || canSeeSubscribers).map(([v, label, n]) => (
            <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium ${tab === v ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {label}<span className={`rounded-full px-2 py-0.5 text-xs ${tab === v ? "bg-primary/10" : "bg-muted"}`}>{n}</span>
            </button>
          ))}
        </div>

        {tab === "messages" ? (
          <>
            <div role="group" aria-label="Filter messages" className="flex flex-wrap gap-2 p-3">
              {FILTERS.map((f) => <button key={f.value} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)} className={`rounded-full border px-3 py-1 text-sm ${filter === f.value ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{f.label} <span className="opacity-70">{count(f.value)}</span></button>)}
            </div>
            {list.length === 0 ? (
              <div className="grid justify-items-center gap-2 px-6 py-16 text-center"><span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground"><Inbox className="size-6" aria-hidden="true" /></span>
                <p className="font-semibold">{filter === "new" ? "No new messages" : "Nothing here"}</p><p className="text-sm text-muted-foreground">Messages from the contact form appear here.</p></div>
            ) : (
              <ul className="divide-y">
                {list.map((m) => (
                  <li key={m.id} className="grid gap-3 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2"><span className="font-semibold">{m.name}</span><StatusBadge tone={tone[m.status]}>{m.status[0].toUpperCase() + m.status.slice(1)}</StatusBadge>{m.signedIn && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Has an account</span>}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground"><a href={`mailto:${m.email}`} className="hover:text-primary hover:underline">{m.email}</a> · {fmtDateTime(m.createdAt)} · <span className="font-mono text-xs">{m.reference}</span></p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full bg-muted px-2.5 py-1 font-medium">{m.topic}</span>
                        {m.orderNumber && <Link href={`/admin/orders/${m.orderNumber}`} className="rounded-full bg-primary/10 px-2.5 py-1 font-mono font-medium text-primary hover:underline">{m.orderNumber}</Link>}</div>
                    </div>
                    <p className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-relaxed">{m.message}</p>
                    <div className="flex flex-wrap gap-2">
                      <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic} (${m.reference})`)}`} className={`${btn} border-primary/40 text-primary`}><Mail className="size-3.5" aria-hidden="true" /> Reply by email</a>
                      {m.status === "new" && <button disabled={busy} onClick={() => void setStatus(m.id, "read")} className={btn}><Eye className="size-3.5" aria-hidden="true" /> Mark read</button>}
                      {m.status !== "resolved" && <button disabled={busy} onClick={() => void setStatus(m.id, "resolved")} className={`${btn} border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100`}><CheckCheck className="size-3.5" aria-hidden="true" /> Resolve</button>}
                      {m.status !== "new" && <button disabled={busy} onClick={() => void setStatus(m.id, "new")} className={btn}><Undo2 className="size-3.5" aria-hidden="true" /> Reopen</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-muted-foreground"><strong className="text-foreground">{subscribers.subscribed}</strong> subscribed · {subscribers.total} total (including people who unsubscribed)</p>
              <button className={btn} onClick={() => downloadCsv("newsletter-subscribers.csv", [["Email", "Status", "Source", "Signed up"], ...subscribers.items.filter((s) => s.status === "subscribed").map((s) => [s.email, s.status, s.source, s.createdAt.slice(0, 10)])])}><Download className="size-3.5" aria-hidden="true" /> Export subscribed (CSV)</button>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[36rem] text-left text-sm"><caption className="sr-only">Newsletter subscribers</caption>
              <thead><tr className="border-y bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">Email</th><th className="px-3 font-medium">Status</th><th className="px-3 font-medium">Source</th><th className="px-3 font-medium">Signed up</th><th className="px-5 text-right font-medium">Remove</th></tr></thead>
              <tbody>{subscribers.items.length === 0 ? <tr><td colSpan={5} className="py-14 text-center text-muted-foreground">No subscribers yet.</td></tr> : subscribers.items.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-5 py-3 font-medium">{s.email}</td><td className="px-3"><StatusBadge tone={s.status === "subscribed" ? "good" : "muted"}>{s.status === "subscribed" ? "Subscribed" : "Unsubscribed"}</StatusBadge></td>
                  <td className="px-3 capitalize text-muted-foreground">{s.source}</td><td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDateTime(s.createdAt)}</td>
                  <td className="px-5 text-right"><button aria-label={`Remove ${s.email}`} onClick={() => setRemoving(s)} className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" aria-hidden="true" /></button></td></tr>))}</tbody></table></div>
          </div>
        )}
      </div>
      <ConfirmDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)} destructive title="Remove this subscriber?" description={`${removing?.email ?? ""} is deleted from the list for good. Use this for privacy requests; people can also unsubscribe themselves.`} confirmLabel="Remove" onConfirm={() => { if (removing) void run(() => adminApi(`admin/inbox/subscribers/${removing.id}`, { method: "DELETE" })) }} />
    </>
  )
}
