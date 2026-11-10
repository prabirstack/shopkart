"use client"
import { useState } from "react"
import { Plus } from "lucide-react"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { fmtDate } from "@/features/admin/format"
import { useAdminReady } from "@/features/admin/hooks"
import { useAdmin } from "@/features/admin/store"

export function ArticlesView() {
  const ready = useAdminReady()
  const articles = useAdmin((s) => s.articles)
  const toggle = useAdmin((s) => s.toggleArticle)
  const add = useAdmin((s) => s.addArticle)
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [err, setErr] = useState("")
  return (
    <>
      <PageHeader title="Articles" description="Buying guides and news shown on the storefront."><Button onClick={() => { setTitle(""); setErr(""); setOpen(true) }}><Plus aria-hidden="true" /> New article</Button></PageHeader>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs"><div className="overflow-x-auto"><table className="w-full min-w-[40rem] text-left text-sm"><caption className="sr-only">Articles</caption>
        <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">Title</th><th className="px-3 font-medium">URL</th><th className="px-3 font-medium">Updated</th><th className="px-3 font-medium">Status</th><th className="px-5 font-medium">Published</th></tr></thead>
        <tbody>{!ready ? <tr><td colSpan={5} className="p-4"><Skeleton className="h-28" /></td></tr> : articles.map((a) => (
          <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30"><td className="px-5 py-3"><span className="font-medium">{a.title}</span><span className="block text-xs text-muted-foreground">by {a.author}</span></td><td className="px-3 font-mono text-xs text-muted-foreground">/news/{a.slug}</td><td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDate(a.updated)}</td>
            <td className="px-3"><StatusBadge tone={a.published ? "good" : "muted"}>{a.published ? "Published" : "Draft"}</StatusBadge></td><td className="px-5"><Switch checked={a.published} onCheckedChange={() => toggle(a.id)} aria-label={`${a.published ? "Unpublish" : "Publish"} ${a.title}`} /></td></tr>))}</tbody></table></div></div>
      <Dialog open={open} onOpenChange={setOpen}><DialogContent><form onSubmit={(e) => { e.preventDefault(); if (title.trim().length < 5) { setErr("Give it a title of at least 5 characters."); return } add(title.trim()); setOpen(false) }} className="grid gap-4">
        <DialogHeader><DialogTitle>New article</DialogTitle><DialogDescription>It starts as a draft. The full editor arrives with the articles chapter.</DialogDescription></DialogHeader>
        <div className="grid gap-1.5"><label htmlFor="a-title" className="text-sm font-medium">Title</label><input id="a-title" value={title} onChange={(e) => { setTitle(e.target.value); setErr("") }} aria-invalid={err ? true : undefined} className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive" />{err && <p role="alert" className="text-xs text-destructive">{err}</p>}</div>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Create draft</Button></DialogFooter>
      </form></DialogContent></Dialog>
    </>
  )
}
