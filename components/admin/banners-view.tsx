"use client"
import Link from "next/link"
import { useState } from "react"
import { Pause, Play, Plus, Trash2 } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { DEMO_TODAY, fmtDate } from "@/features/admin/format"
import { useAdminReady } from "@/features/admin/hooks"
import { useAdmin } from "@/features/admin/store"
import type { AdminBanner } from "@/features/admin/types"

const SLOTS = ["Home hero", "Home promo grid", "Category banner", "Cart banner"]
const field = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
const status = (b: AdminBanner) => b.paused ? "Paused" : b.ends < DEMO_TODAY ? "Ended" : b.starts > DEMO_TODAY ? "Scheduled" : "Live"
const tone = { Live: "good", Scheduled: "info", Ended: "muted", Paused: "warn" } as const
const day = (iso: string) => Math.round(new Date(`${iso}T00:00:00Z`).getTime() / 86400000)

// Timeline window: 30 days before and 45 days after the demo "today".
const START = day(DEMO_TODAY) - 30, SPAN = 75
const pos = (iso: string) => Math.max(0, Math.min(100, ((day(iso) - START) / SPAN) * 100))

function BannerDialog({ onClose }: { onClose: () => void }) {
  const upsert = useAdmin((s) => s.upsertBanner)
  const [f, setF] = useState({ title: "", slot: SLOTS[0], starts: DEMO_TODAY, ends: "2026-11-30", href: "/deals" })
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = (k: string, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: "" })) }
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); const er: Record<string, string> = {}
    if (f.title.trim().length < 3) er.title = "At least 3 characters."
    if (!f.href.startsWith("/")) er.href = "Use a path on this site, like /deals."
    if (!f.starts) er.starts = "Pick a start date."
    if (!f.ends || f.ends < f.starts) er.ends = "End date must be on or after the start."
    setErrs(er); if (Object.keys(er).length) return
    upsert({ id: `b${Date.now()}`, title: f.title.trim(), slot: f.slot, starts: f.starts, ends: f.ends, href: f.href, paused: false }); onClose()
  }
  const row = (k: "title" | "href" | "starts" | "ends", label: string, type = "text") => <div className="grid gap-1.5"><label htmlFor={`bn-${k}`} className="text-sm font-medium">{label}</label><input id={`bn-${k}`} type={type} value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errs[k] ? true : undefined} className={field} />{errs[k] && <p role="alert" className="text-xs text-destructive">{errs[k]}</p>}</div>
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent><form onSubmit={submit} className="grid gap-4">
      <DialogHeader><DialogTitle>Schedule a banner</DialogTitle><DialogDescription>Headline and link live in HTML on the storefront, so a change here never leaves a stale image.</DialogDescription></DialogHeader>
      {row("title", "Headline")}
      <div className="grid gap-1.5"><label htmlFor="bn-slot" className="text-sm font-medium">Placement</label><select id="bn-slot" value={f.slot} onChange={(e) => set("slot", e.target.value)} className={field}>{SLOTS.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">{row("starts", "Starts", "date")}{row("ends", "Ends", "date")}</div>
      {row("href", "Link to")}
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Schedule banner</Button></DialogFooter>
    </form></DialogContent></Dialog>
  )
}

export function BannersView() {
  const ready = useAdminReady()
  const banners = useAdmin((s) => s.banners)
  const upsert = useAdmin((s) => s.upsertBanner)
  const del = useAdmin((s) => s.deleteBanner)
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState<AdminBanner | null>(null)
  const sorted = [...banners].sort((a, b) => a.starts.localeCompare(b.starts))
  return (
    <>
      <PageHeader title="Banners" description="Schedule homepage campaigns. Live banners follow their start and end dates automatically."><Button onClick={() => setCreating(true)}><Plus aria-hidden="true" /> Schedule banner</Button></PageHeader>
      <section aria-labelledby="tl-h" className="rounded-2xl border bg-card p-5 shadow-xs">
        <h2 id="tl-h" className="mb-4 font-semibold">Schedule</h2>
        {!ready ? <Skeleton className="h-32" /> : (
          <div className="relative grid gap-2" role="img" aria-label="Campaign schedule timeline">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 z-10 w-px bg-primary" style={{ left: `${pos(DEMO_TODAY)}%` }}><span className="absolute -top-5 -translate-x-1/2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">Today</span></span>
            {sorted.map((b) => { const l = pos(b.starts), r = pos(b.ends), st = status(b); return (
              <div key={b.id} className="relative h-8 rounded-lg bg-muted/50"><span className={`absolute inset-y-1 flex items-center truncate rounded-md px-2 text-xs font-semibold ${st === "Live" ? "bg-emerald-500 text-white" : st === "Scheduled" ? "bg-blue-500 text-white" : st === "Paused" ? "bg-amber-400 text-amber-950" : "bg-neutral-300 text-neutral-700"}`} style={{ left: `${l}%`, width: `${Math.max(r - l, 6)}%` }}>{b.title}</span></div>) })}
          </div>)}
      </section>
      {!ready ? <Skeleton className="h-48 rounded-2xl" /> : (
        <ul className="grid gap-3 md:grid-cols-2">{sorted.map((b) => { const st = status(b); return (
          <li key={b.id} className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{b.title}</p><p className="text-sm text-muted-foreground">{b.slot} · links to <Link href={b.href} className="text-primary hover:underline">{b.href}</Link></p></div><StatusBadge tone={tone[st]}>{st}</StatusBadge></div>
            <p className="text-sm text-muted-foreground">{fmtDate(b.starts)} to {fmtDate(b.ends)}</p>
            <div className="flex gap-2">
              {st !== "Ended" && <button onClick={() => upsert({ ...b, paused: !b.paused })} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted">{b.paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}{b.paused ? "Resume" : "Pause"}</button>}
              <button onClick={() => setRemoving(b)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5"><Trash2 className="size-3.5" aria-hidden="true" /> Delete</button>
            </div>
          </li>) })}</ul>)}
      {creating && <BannerDialog onClose={() => setCreating(false)} />}
      <ConfirmDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)} title={`Delete "${removing?.title}"?`} description={`This removes the ${removing?.slot} campaign scheduled ${removing ? fmtDate(removing.starts) : ""} to ${removing ? fmtDate(removing.ends) : ""}.`} confirmLabel="Delete banner" onConfirm={() => removing && del(removing.id)} />
    </>
  )
}
