"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, ExternalLink, Save, X } from "lucide-react"
import { PageHeader } from "./page-header"
import { RichEditor } from "./rich-editor"
import { Button } from "@/components/ui/button"
import { emptyDoc } from "@/features/articles/doc"
import { readMinutes, slugify, wordCount } from "@/features/articles/render"
import { ARTICLE_CATEGORIES, type Article, type ArticleCategory } from "@/features/articles/types"
import { adminApi, ApiFailure, failureMessage } from "@/features/admin/api"

const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
const CATEGORY_KEY: Record<ArticleCategory, string> = { "Buying guide": "buying_guide", "Product review": "product_review", Comparison: "comparison", News: "news" }
type Choice = { id: string; title: string; slug: string }

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return <div className="grid gap-1.5"><label htmlFor={id} className="text-sm font-medium">{label}</label>{children}{error ? <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>
}

/** `article` is undefined when creating, and null when an id was asked for but nothing exists. */
export function ArticleForm({ article, products }: { article?: Article | null; products: Choice[] }) {
  const router = useRouter()
  if (article === null) return <div className="grid justify-items-center gap-3 rounded-2xl border bg-card p-12 text-center"><p className="font-semibold">Article not found</p><Link href="/admin/articles" className="text-sm font-medium text-primary hover:underline">Back to articles</Link></div>
  return <Editor key={article?.id ?? "new"} article={article} products={products} onDone={() => { router.push("/admin/articles"); router.refresh() }} />
}

function Editor({ article, products, onDone }: { article?: Article; products: Choice[]; onDone: () => void }) {
  const titleOf = (pid: string) => products.find((p) => p.id === pid)?.title ?? "Unknown product"
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [f, setF] = useState(() => ({
    title: article?.title ?? "", slug: article?.slug ?? "", category: (article?.category ?? "Buying guide") as ArticleCategory, author: article?.author ?? "Team ShopKart", status: article?.status ?? "draft",
    excerpt: article?.excerpt ?? "", seoTitle: article?.seoTitle ?? "", seoDescription: article?.seoDescription ?? "", productIds: article?.productIds ?? [], compareIds: article?.compareIds ?? [],
  }))
  const [doc, setDoc] = useState(article?.doc ?? emptyDoc)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)
  const slugTouched = Boolean(article)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => { setF((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: "" })); setSaved(false) }
  const words = useMemo(() => wordCount(doc), [doc])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.title.trim().length < 5) er.title = "Give it a title of at least 5 characters."
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) er.slug = "Lowercase letters, numbers and hyphens only."
    if (f.excerpt.trim().length < 20 || f.excerpt.length > 200) er.excerpt = "Write a summary of 20 to 200 characters."
    if (f.status === "published" && words < 30) er.body = "A published article needs at least 30 words."
    if (f.seoTitle.length > 70) er.seoTitle = "Keep it under 70 characters."
    if (f.seoDescription.length > 160) er.seoDescription = "Keep it under 160 characters."
    if (f.compareIds.length === 1) er.compareIds = "Pick at least two products to compare, or none."
    setErrs(er); if (Object.keys(er).length) return
    setFormError(""); setSaving(true)
    const body = { slug: f.slug, title: f.title.trim(), excerpt: f.excerpt.trim(), category: CATEGORY_KEY[f.category], authorName: f.author.trim() || "Team ShopKart", status: f.status, doc, seoTitle: f.seoTitle.trim(), seoDescription: f.seoDescription.trim(), featuredProductIds: f.productIds, compareProductIds: f.compareIds }
    try {
      await adminApi(article ? `admin/articles/${article.id}` : "admin/articles", { method: article ? "PUT" : "POST", body })
    } catch (err) {
      // Per-field problems from the server (for example a URL that another article already uses) appear beside the field.
      const fields = err instanceof ApiFailure ? err.fields : []
      if (fields.length) setErrs(Object.fromEntries(fields.map((x) => [x.path === "featuredProductIds" ? "productIds" : x.path === "compareProductIds" ? "compareIds" : x.path === "authorName" ? "author" : x.path, x.message])))
      setFormError(failureMessage(err)); return
    } finally { setSaving(false) }
    setSaved(true); window.setTimeout(onDone, 700)
  }
  const chips = (ids: string[], key: "productIds" | "compareIds", max: number, label: string, pool: string[]) => (
    <div className="grid min-w-0 gap-2">
      <div className="flex flex-wrap gap-2">{ids.map((pid) => <span key={pid} className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1 text-xs font-medium">{titleOf(pid)}<button type="button" aria-label={`Remove ${titleOf(pid)}`} onClick={() => set(key, ids.filter((x) => x !== pid))} className="grid size-5 place-items-center rounded-full hover:bg-background"><X className="size-3" aria-hidden="true" /></button></span>)}</div>
      <select aria-label={label} value="" onChange={(e) => { if (e.target.value && ids.length < max) set(key, [...ids, e.target.value]) }} disabled={ids.length >= max} className={input}><option value="">{ids.length >= max ? `Up to ${max} products` : "Add a product…"}</option>{pool.filter((x) => !ids.includes(x)).map((pid) => <option key={pid} value={pid}>{titleOf(pid)}</option>)}</select>
    </div>
  )
  return (
    <form onSubmit={save} noValidate className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <Link href="/admin/articles" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /> All articles</Link>
      <PageHeader title={article ? "Edit article" : "New article"} description={article ? `Last updated ${article.updatedAt}` : "Write in the editor, then save as a draft or publish."}>
        <div className="flex flex-wrap items-center gap-2">
          {article && f.status === "published" && <Link href={`/news/${f.slug}`} target="_blank" className="inline-flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium hover:bg-muted"><ExternalLink className="size-4" aria-hidden="true" /> View on store</Link>}
          <label htmlFor="status" className="sr-only">Status</label>
          <select id="status" value={f.status} onChange={(e) => set("status", e.target.value as Article["status"])} className="h-10 rounded-lg border bg-card px-3 text-sm"><option value="draft">Draft</option><option value="published">Published</option></select>
          <Button type="submit" disabled={saved || saving}>{saved ? <CheckCircle2 aria-hidden="true" /> : <Save aria-hidden="true" />}{saved ? "Saved" : "Save article"}</Button>
        </div>
      </PageHeader>
      <p role="status" className="text-sm text-emerald-700">{saved ? "Saved. Taking you back to the list…" : ""}</p>
      {formError && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">{formError}</p>}
      {Object.keys(errs).length > 0 && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">Please fix the highlighted fields.</p>}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-5">
          <div className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs">
            <Field id="title" label="Title" error={errs.title}><input id="title" value={f.title} onChange={(e) => { set("title", e.target.value); if (!slugTouched) setF((p) => ({ ...p, slug: slugify(e.target.value) })) }} aria-invalid={errs.title ? true : undefined} className={input} /></Field>
            <Field id="excerpt" label="Summary" error={errs.excerpt} hint={`${f.excerpt.length} / 200. Shown on cards and in search results.`}><textarea id="excerpt" value={f.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} aria-invalid={errs.excerpt ? true : undefined} className={`${input} h-auto py-2`} /></Field>
          </div>
          <section aria-labelledby="body-h" className="grid gap-2"><h2 id="body-h" className="text-sm font-semibold">Article body</h2><RichEditor products={products} value={doc} onChange={(d) => { setDoc(d); setErrs((e) => ({ ...e, body: "" })); setSaved(false) }} invalid={!!errs.body} />{errs.body && <p role="alert" className="text-xs text-destructive">{errs.body}</p>}</section>
        </div>
        <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5 [&>section]:grid-cols-[minmax(0,1fr)]">
          <section aria-labelledby="meta-h" className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs"><h2 id="meta-h" className="font-semibold">Details</h2>
            <Field id="category" label="Type"><select id="category" value={f.category} onChange={(e) => set("category", e.target.value as ArticleCategory)} className={input}>{ARTICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
            <Field id="slug" label="URL" error={errs.slug} hint={`/news/${f.slug || "your-article"}`}><input id="slug" value={f.slug} onChange={(e) => set("slug", e.target.value)} aria-invalid={errs.slug ? true : undefined} className={`${input} font-mono`} /></Field>
            <Field id="author" label="Author"><input id="author" value={f.author} onChange={(e) => set("author", e.target.value)} className={input} /></Field>
            <p className="text-xs text-muted-foreground">{words} words · {readMinutes(doc)} min read</p>
          </section>
          <section aria-labelledby="prod-h" className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs"><h2 id="prod-h" className="font-semibold">Featured products</h2><p className="text-xs text-muted-foreground">Shown as cards under the article. Reviews and guides also appear on those product pages.</p>{chips(f.productIds, "productIds", 6, "Add a featured product", products.map((p) => p.id))}</section>
          {f.category === "Comparison" && <section aria-labelledby="cmp-h" className="grid gap-3 rounded-2xl border bg-card p-5 shadow-xs"><h2 id="cmp-h" className="font-semibold">Compare these products</h2><p className="text-xs text-muted-foreground">Adds an “Open comparison” button that loads these 2 to 4 products in the compare page.</p>{chips(f.compareIds, "compareIds", 4, "Add a product to compare", products.map((p) => p.id))}{errs.compareIds && <p role="alert" className="text-xs text-destructive">{errs.compareIds}</p>}</section>}
          <section aria-labelledby="seo-h" className="grid gap-4 rounded-2xl border bg-card p-5 shadow-xs"><h2 id="seo-h" className="font-semibold">Search appearance</h2>
            <Field id="seoTitle" label="Search title" error={errs.seoTitle} hint={`${f.seoTitle.length} / 70. Leave empty to use the title.`}><input id="seoTitle" value={f.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} className={input} /></Field>
            <Field id="seoDescription" label="Search description" error={errs.seoDescription} hint={`${f.seoDescription.length} / 160`}><textarea id="seoDescription" value={f.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} rows={3} className={`${input} h-auto py-2`} /></Field>
            <div className="rounded-xl border p-3"><p className="truncate text-xs text-emerald-800">shopkart.example › news › {f.slug || "your-article"}</p><p className="truncate text-base text-blue-700">{f.seoTitle || f.title || "Article title"}</p><p className="line-clamp-2 text-xs text-muted-foreground">{f.seoDescription || f.excerpt || "The summary search engines show appears here."}</p></div>
          </section>
        </aside>
      </div>
    </form>
  )
}
