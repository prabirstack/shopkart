"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"
import { Pencil, Pause, Play, Plus, Trash2 } from "lucide-react"
import { BannerImageField } from "./banner-image-field"
import { StorefrontArtwork } from "./storefront-artwork"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { fmtDate } from "@/features/admin/format"
import { useToday } from "@/features/admin/today"
import { adminApi, ApiFailure, failureMessage } from "@/features/admin/api"
import { BANNER_SLOT_FROM_LABEL, type AdminBanner, type AdminImage } from "@/features/admin/types"

const FIELD_KEY: Record<string, string> = { startsAt: "starts", endsAt: "ends" }
const SLOTS = ["Home hero", "Home promo grid", "Category banner", "Cart banner"]
const field = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
const status = (b: AdminBanner, today: string) => b.paused ? "Paused" : b.ends < today ? "Ended" : b.starts > today ? "Scheduled" : "Live"
const tone = { Live: "good", Scheduled: "info", Ended: "muted", Paused: "warn" } as const
const day = (iso: string) => Math.round(new Date(`${iso}T00:00:00Z`).getTime() / 86400000)

// Timeline window: 30 days before and 45 days after the demo "today".
const SPAN = 75
const addDays = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10)
/** Position on the timeline: 0% is 30 days before today. */
const posFor = (today: string) => (iso: string) => Math.max(0, Math.min(100, ((day(iso) - (day(today) - 30)) / SPAN) * 100))

/** Schedules a new banner, or edits an existing one (`banner`). The image is saved with the rest of the form. */
function BannerDialog({ banner, onClose, onSaved }: { banner?: AdminBanner; onClose: () => void; onSaved: () => void }) {
  const today = useToday()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [f, setF] = useState(banner ? { title: banner.title, slot: banner.slot, starts: banner.starts, ends: banner.ends, href: banner.href } : { title: "", slot: SLOTS[0], starts: today, ends: addDays(today, 30), href: "/deals" })
  const [image, setImage] = useState<AdminImage | null>(banner?.image ?? null)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const set = (k: string, v: string) => { setF((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: "" })) }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); const er: Record<string, string> = {}
    if (f.title.trim().length < 3) er.title = "At least 3 characters."
    if (!f.href.startsWith("/")) er.href = "Use a path on this site, like /deals."
    if (!f.starts) er.starts = "Pick a start date."
    if (!f.ends || f.ends < f.starts) er.ends = "End date must be on or after the start."
    setErrs(er); if (Object.keys(er).length) return
    setBusy(true); setError("")
    try {
      const body = { title: f.title.trim(), slot: BANNER_SLOT_FROM_LABEL[f.slot], startsAt: `${f.starts}T00:00:00+05:30`, endsAt: `${f.ends}T23:59:59+05:30`, href: f.href.trim() }
      const img = image ? { url: image.url, alt: image.alt.trim(), width: image.width, height: image.height } : null
      if (banner) await adminApi(`admin/banners/${banner.id}`, { method: "PATCH", body: { ...body, image: img } })
      else await adminApi("admin/banners", { method: "POST", body: { ...body, ...(img ? { image: img } : {}) } })
      onSaved(); onClose()
    } catch (err) {
      if (err instanceof ApiFailure && err.fields.length) { const fe: Record<string, string> = {}; for (const d of err.fields) fe[FIELD_KEY[d.path] ?? d.path] = d.message; setErrs(fe); setError(Object.keys(fe).some((k) => k in f) ? "" : err.message) }
      else setError(failureMessage(err))
    } finally { setBusy(false) }
  }
  const row = (k: "title" | "href" | "starts" | "ends", label: string, type = "text") => <div className="grid gap-1.5"><label htmlFor={`bn-${k}`} className="text-sm font-medium">{label}</label><input id={`bn-${k}`} type={type} value={f[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errs[k] ? true : undefined} className={field} />{errs[k] && <p role="alert" className="text-xs text-destructive">{errs[k]}</p>}</div>
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}><DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl"><form onSubmit={submit} className="grid gap-4">
      <DialogHeader><DialogTitle>{banner ? "Edit banner" : "Schedule a banner"}</DialogTitle><DialogDescription>Headline and link live in HTML on the storefront, so a change here never leaves a stale image.</DialogDescription></DialogHeader>
      {row("title", "Headline")}
      <div className="grid gap-1.5"><label htmlFor="bn-slot" className="text-sm font-medium">Placement</label><select id="bn-slot" value={f.slot} onChange={(e) => set("slot", e.target.value)} className={field}>{SLOTS.map((s) => <option key={s}>{s}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-3">{row("starts", "Starts", "date")}{row("ends", "Ends", "date")}</div>
      {row("href", "Link to")}
      <BannerImageField slot={BANNER_SLOT_FROM_LABEL[f.slot]} title={f.title} value={image} onChange={setImage} />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={busy}>{banner ? "Save changes" : "Schedule banner"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
  )
}

export function BannersView({ banners }: { banners: AdminBanner[] }) {
  const today = useToday()
  const pos = posFor(today)
  const router = useRouter()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  // Every change goes through the permission-checked API, then the server re-loads the list.
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError("")
    try { await fn(); router.refresh() } catch (e) { setError(failureMessage(e)) } finally { setBusy(false) }
  }
  const togglePause = (b: AdminBanner) => run(() => adminApi(`admin/banners/${b.id}`, { method: "PATCH", body: { isPaused: !b.paused } }))
  const del = (id: string) => run(() => adminApi(`admin/banners/${id}`, { method: "DELETE" }))
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<AdminBanner | null>(null)
  const [removing, setRemoving] = useState<AdminBanner | null>(null)
  const sorted = [...banners].sort((a, b) => a.starts.localeCompare(b.starts))
  return (
    <>
      <PageHeader title="Banners" description="Schedule homepage campaigns. Live banners follow their start and end dates automatically."><Button onClick={() => setCreating(true)}><Plus aria-hidden="true" /> Schedule banner</Button></PageHeader>
      {error && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">{error}</p>}
      <section aria-labelledby="tl-h" className="rounded-2xl border bg-card p-5 shadow-xs">
        <h2 id="tl-h" className="mb-4 font-semibold">Schedule</h2>
        {banners.length === 0 ? <p className="text-sm text-muted-foreground">No banners scheduled.</p> : (
          <div className="relative grid gap-2" role="img" aria-label="Campaign schedule timeline">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 z-10 w-px bg-primary" style={{ left: `${pos(today)}%` }}><span className="absolute -top-5 -translate-x-1/2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">Today</span></span>
            {sorted.map((b) => { const l = pos(b.starts), r = pos(b.ends), st = status(b, today); return (
              <div key={b.id} className="relative h-8 rounded-lg bg-muted/50"><span className={`absolute inset-y-1 flex items-center truncate rounded-md px-2 text-xs font-semibold ${st === "Live" ? "bg-emerald-500 text-white" : st === "Scheduled" ? "bg-blue-500 text-white" : st === "Paused" ? "bg-amber-400 text-amber-950" : "bg-neutral-300 text-neutral-700"}`} style={{ left: `${l}%`, width: `${Math.max(r - l, 6)}%` }}>{b.title}</span></div>) })}
          </div>)}
      </section>
      {banners.length > 0 && (
        <ul aria-busy={busy} className={`grid gap-3 transition-opacity md:grid-cols-2 ${busy ? "opacity-70" : ""}`}>{sorted.map((b) => { const st = status(b, today); return (
          <li key={b.id} className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs">
            {b.image && <div className="relative aspect-[3/1] overflow-hidden rounded-lg border bg-muted"><Image src={b.image.url} alt={b.image.alt || `${b.title} banner`} fill sizes="(max-width: 768px) 90vw, 420px" className="object-contain" /></div>}
            <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{b.title}</p><p className="text-sm text-muted-foreground">{b.slot} · links to <Link href={b.href} className="text-primary hover:underline">{b.href}</Link></p></div><StatusBadge tone={tone[st]}>{st}</StatusBadge></div>
            <p className="text-sm text-muted-foreground">{fmtDate(b.starts)} to {fmtDate(b.ends)}</p>
            <div className="flex gap-2">
              {st !== "Ended" && <button onClick={() => void togglePause(b)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted">{b.paused ? <Play className="size-3.5" aria-hidden="true" /> : <Pause className="size-3.5" aria-hidden="true" />}{b.paused ? "Resume" : "Pause"}</button>}
              <button onClick={() => setEditing(b)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-muted"><Pencil className="size-3.5" aria-hidden="true" /> Edit</button>
              <button onClick={() => setRemoving(b)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5"><Trash2 className="size-3.5" aria-hidden="true" /> Delete</button>
            </div>
          </li>) })}</ul>)}
      <StorefrontArtwork />
      {creating && <BannerDialog onClose={() => setCreating(false)} onSaved={() => router.refresh()} />}
      {editing && <BannerDialog key={editing.id} banner={editing} onClose={() => setEditing(null)} onSaved={() => router.refresh()} />}
      <ConfirmDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)} title={`Delete "${removing?.title}"?`} description={`This removes the ${removing?.slot} campaign scheduled ${removing ? fmtDate(removing.starts) : ""} to ${removing ? fmtDate(removing.ends) : ""}.`} confirmLabel="Delete banner" onConfirm={() => { if (removing) void del(removing.id) }} />
    </>
  )
}
