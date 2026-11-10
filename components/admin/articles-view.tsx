"use client"
import Link from "next/link"
import { useState } from "react"
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { StatusBadge } from "./status-badge"
import { categoryStyle } from "@/components/articles/article-card"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { readMinutes } from "@/features/articles/render"
import { useArticleStore, useArticlesReady } from "@/features/articles/store"
import type { Article } from "@/features/articles/types"
import { fmtDate } from "@/features/admin/format"

export function ArticlesView() {
  const ready = useArticlesReady()
  const articles = useArticleStore((s) => s.articles)
  const setStatus = useArticleStore((s) => s.setStatus)
  const remove = useArticleStore((s) => s.remove)
  const [removing, setRemoving] = useState<Article | null>(null)
  return (
    <>
      <PageHeader title="Articles" description="Guides, product reviews and comparisons shown on the storefront. Written in the rich-text editor.">
        <Link href="/admin/articles/new" className={buttonVariants()}><Plus aria-hidden="true" /> New article</Link>
      </PageHeader>
      <ul aria-label="Article summary" className="grid gap-3 sm:grid-cols-3">
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Published</p><p className="price mt-1 text-2xl font-bold">{ready ? articles.filter((a) => a.status === "published").length : "–"}</p></li>
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Drafts</p><p className="price mt-1 text-2xl font-bold">{ready ? articles.filter((a) => a.status === "draft").length : "–"}</p></li>
        <li className="rounded-2xl border bg-card p-4 shadow-xs"><p className="text-sm text-muted-foreground">Comparisons and reviews</p><p className="price mt-1 text-2xl font-bold">{ready ? articles.filter((a) => a.category === "Comparison" || a.category === "Product review").length : "–"}</p></li>
      </ul>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-xs"><div className="overflow-x-auto"><table className="w-full min-w-[52rem] text-left text-sm"><caption className="sr-only">Articles</caption>
        <thead><tr className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><th className="px-5 py-2.5 font-medium">Article</th><th className="px-3 font-medium">Type</th><th className="px-3 font-medium">Status</th><th className="px-3 font-medium">Updated</th><th className="px-3 text-right font-medium">Read</th><th className="px-3 font-medium">Published</th><th className="px-5 text-right font-medium">Actions</th></tr></thead>
        <tbody>{!ready ? <tr><td colSpan={7} className="p-4"><Skeleton className="h-32" /></td></tr> : articles.length === 0 ? <tr><td colSpan={7} className="py-14 text-center text-muted-foreground">No articles yet. Write your first buying guide.</td></tr> : articles.map((a) => (
          <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
            <td className="px-5 py-3"><Link href={`/admin/articles/${a.id}`} className="font-medium hover:text-primary">{a.title}</Link><span className="block font-mono text-xs text-muted-foreground">/news/{a.slug}</span></td>
            <td className="px-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryStyle[a.category].badge}`}>{a.category}</span></td>
            <td className="px-3"><StatusBadge tone={a.status === "published" ? "good" : "muted"}>{a.status === "published" ? "Published" : "Draft"}</StatusBadge></td>
            <td className="whitespace-nowrap px-3 text-muted-foreground">{fmtDate(a.updatedAt)}</td><td className="price px-3 text-right text-muted-foreground">{readMinutes(a.doc)} min</td>
            <td className="px-3"><Switch checked={a.status === "published"} onCheckedChange={(on) => setStatus(a.id, on ? "published" : "draft")} aria-label={`${a.status === "published" ? "Unpublish" : "Publish"} ${a.title}`} /></td>
            <td className="px-5 text-right"><div className="flex justify-end gap-1">
              {a.status === "published" && <Link href={`/news/${a.slug}`} target="_blank" aria-label={`View ${a.title} on store`} className="grid size-8 place-items-center rounded-lg hover:bg-muted"><ExternalLink className="size-4" aria-hidden="true" /></Link>}
              <Link href={`/admin/articles/${a.id}`} aria-label={`Edit ${a.title}`} className="grid size-8 place-items-center rounded-lg hover:bg-muted"><Pencil className="size-4" aria-hidden="true" /></Link>
              <button aria-label={`Delete ${a.title}`} onClick={() => setRemoving(a)} className="grid size-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" aria-hidden="true" /></button></div></td>
          </tr>))}</tbody></table></div></div>
      <ConfirmDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)} title={`Delete "${removing?.title}"?`} description="The article is removed from the storefront and its link stops working. This can't be undone." confirmLabel="Delete article" onConfirm={() => removing && remove(removing.id)} />
    </>
  )
}
