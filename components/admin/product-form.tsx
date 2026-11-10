"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, CheckCircle2, ImagePlus, Info, Save } from "lucide-react"
import { PageHeader } from "./page-header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { brands, categories } from "@/features/catalog/demo"
import { money } from "@/features/admin/format"
import { useAdminReady } from "@/features/admin/hooks"
import { useAdmin } from "@/features/admin/store"
import type { AdminProduct } from "@/features/admin/types"
import { gstFromInclusive, toCents } from "@/lib/money"

const GST_RATES = [0, 5, 12, 18, 28]
/** New product IDs are made on save, never during render. */
const newProductId = () => `p${Date.now()}`
const schema = z.object({
  title: z.string().trim().min(3, "Enter at least 3 characters").max(120),
  slug: z.string().trim().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens"),
  brand: z.string().trim().min(2, "Choose or type a brand"),
  category: z.string().min(1, "Choose a category"),
  description: z.string().trim().min(20, "Describe the product in at least 20 characters").max(2000),
  status: z.enum(["published", "draft", "archived"]),
  price: z.number({ message: "Enter the selling price" }).positive("Price must be above zero").max(10000000),
  compare: z.number().positive("Must be above zero").optional(),
  gst: z.number(),
  sku: z.string().trim().min(3, "SKU needs at least 3 characters").max(40),
  stock: z.number({ message: "Enter a whole number" }).int("Whole numbers only").min(0, "Can't be negative"),
  reorderAt: z.number({ message: "Enter a whole number" }).int("Whole numbers only").min(0, "Can't be negative"),
  seoTitle: z.string().trim().max(70, "Keep it under 70 characters"),
  seoDescription: z.string().trim().max(160, "Keep it under 160 characters"),
}).refine((v) => v.compare === undefined || v.compare > v.price, { path: ["compare"], message: "Compare-at price must be higher than the selling price" })
type Values = z.input<typeof schema>

const input = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
const num = { setValueAs: (v: string) => (v === "" ? undefined : Number(v)) }

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>{children}
      {error ? <p id={`${id}-error`} role="alert" className="text-xs text-destructive">{error}</p> : hint ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

const toValues = (p: AdminProduct): Values => ({ title: p.title, slug: p.slug, brand: p.brand, category: p.category, description: p.description, status: p.status, price: p.pricePaise / 100, compare: p.comparePaise ? p.comparePaise / 100 : undefined, gst: p.gstPercent, sku: p.sku, stock: p.stock, reorderAt: p.reorderAt, seoTitle: p.seoTitle, seoDescription: p.seoDescription })
const blank: Values = { title: "", slug: "", brand: "", category: "", description: "", status: "draft", price: undefined as unknown as number, compare: undefined, gst: 18, sku: "", stock: 0, reorderAt: 10, seoTitle: "", seoDescription: "" }

export function ProductForm({ id }: { id?: string }) {
  const router = useRouter()
  const ready = useAdminReady()
  const existing = useAdmin((s) => (id ? s.products.find((p) => p.id === id) : undefined))
  if (!ready) return <Skeleton className="h-[32rem] rounded-2xl" />
  if (id && !existing) return (
    <div className="grid justify-items-center gap-3 rounded-2xl border bg-card p-12 text-center"><p className="font-semibold">Product not found</p><p className="text-sm text-muted-foreground">It may have been deleted.</p><Link href="/admin/products" className="text-sm font-medium text-primary hover:underline">Back to products</Link></div>
  )
  return <Editor key={id ?? "new"} product={existing} onDone={() => router.push("/admin/products")} />
}

function Editor({ product, onDone }: { product?: AdminProduct; onDone: () => void }) {
  const upsert = useAdmin((s) => s.upsertProduct)
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit, control, setValue, formState: { errors, isDirty } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: product ? toValues(product) : blank })
  const v = useWatch({ control })
  const err = (k: keyof Values) => errors[k]?.message as string | undefined
  const a = (k: keyof Values, hint = false) => ({ id: k, "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-error` : hint ? `${k}-hint` : undefined })

  const price = typeof v.price === "number" && !Number.isNaN(v.price) ? toCents(v.price) : 0
  const gst = gstFromInclusive(price, v.gst ?? 18)
  const discount = v.compare && v.price && v.compare > v.price ? Math.round(((v.compare - v.price) / v.compare) * 100) : 0
  const errorTabs = { general: ["title", "slug", "brand", "category", "description"], pricing: ["price", "compare"], inventory: ["sku", "stock", "reorderAt"], seo: ["seoTitle", "seoDescription"] } as const
  const bad = (t: keyof typeof errorTabs) => errorTabs[t].some((k) => errors[k as keyof Values])

  const save = handleSubmit((d) => {
    upsert({
      id: product?.id ?? newProductId(), title: d.title, slug: d.slug, sku: d.sku, category: d.category, brand: d.brand,
      pricePaise: toCents(d.price), comparePaise: d.compare ? toCents(d.compare) : null, gstPercent: d.gst, stock: d.stock, reserved: product?.reserved ?? 0, reorderAt: d.reorderAt,
      status: d.status, description: d.description, seoTitle: d.seoTitle, seoDescription: d.seoDescription, createdAt: product?.createdAt ?? "2026-11-10",
    })
    setSaved(true); window.setTimeout(onDone, 700)
  })

  return (
    <form onSubmit={save} noValidate className="grid gap-6">
      <Link href="/admin/products" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /> All products</Link>
      <PageHeader title={product ? product.title : "New product"} description={product ? `SKU ${product.sku}` : "Fill in the details. Save as a draft first, publish when it's ready."}>
        <div className="flex items-center gap-2">
          <label htmlFor="status" className="sr-only">Status</label>
          <select {...register("status")} id="status" className="h-10 rounded-lg border bg-card px-3 text-sm"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
          <Button type="submit" disabled={saved}>{saved ? <CheckCircle2 aria-hidden="true" /> : <Save aria-hidden="true" />}{saved ? "Saved" : product ? "Save changes" : "Create product"}</Button>
        </div>
      </PageHeader>
      <p role="status" className="text-sm text-emerald-700">{saved ? "Saved. Taking you back to the list…" : ""}</p>
      {Object.keys(errors).length > 0 && <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-2 text-sm text-destructive">Some fields need attention. Tabs with a red dot contain errors.</p>}

      <Tabs defaultValue="general" className="gap-0">
        <TabsList variant="line" aria-label="Product sections" className="h-auto w-full justify-start overflow-x-auto rounded-none border-b p-0">
          {([["general", "General"], ["pricing", "Pricing & GST"], ["inventory", "Inventory"], ["media", "Media"], ["seo", "SEO"]] as const).map(([val, label]) => (
            <TabsTrigger key={val} value={val} className="h-auto flex-none rounded-none border-0 px-5 py-3 text-[0.95rem] text-muted-foreground data-active:bg-transparent data-active:font-semibold data-active:text-primary data-active:shadow-none after:!bottom-0 after:h-[3px] after:rounded-full after:bg-primary">
              {label}{val in errorTabs && bad(val as keyof typeof errorTabs) && <span aria-label="has errors" className="ml-1.5 size-2 rounded-full bg-destructive" />}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="grid gap-4 rounded-2xl border bg-card p-5 sm:col-span-2 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field id="title" label="Title" error={err("title")}><input {...register("title", { onChange: (e) => { if (!product && !v.slug) setValue("slug", String(e.target.value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")) } })} {...a("title")} className={input} /></Field></div>
            <Field id="slug" label="URL slug" error={err("slug")} hint={`Shown as /products/${v.slug || "your-slug"}`}><input {...register("slug")} {...a("slug", true)} className={input} /></Field>
            <Field id="brand" label="Brand" error={err("brand")}><input {...register("brand")} {...a("brand")} list="brand-list" className={input} /><datalist id="brand-list">{brands.map((b) => <option key={b} value={b} />)}</datalist></Field>
            <Field id="category" label="Category" error={err("category")}><select {...register("category")} {...a("category")} className={input}><option value="">Select category</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></Field>
            <div className="sm:col-span-2"><Field id="description" label="Description" error={err("description")} hint={`${(v.description ?? "").length} / 2000`}><textarea {...register("description")} {...a("description", true)} rows={6} className={`${input} h-auto py-2`} /></Field></div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="grid gap-4 pt-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
            <Field id="price" label="Selling price (₹, GST included)" error={err("price")}><input {...register("price", { ...num })} {...a("price")} inputMode="decimal" className={input} /></Field>
            <Field id="compare" label="Compare-at price (₹)" error={err("compare")} hint="Optional. Shown struck through. Must be higher than the selling price."><input {...register("compare", { ...num })} {...a("compare", true)} inputMode="decimal" className={input} /></Field>
            <Field id="gst" label="GST rate"><select {...register("gst", { valueAsNumber: true })} id="gst" className={input}>{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select></Field>
            <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground sm:self-end"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /> Shoppers see one GST-inclusive price. The split below appears on the tax invoice.</p>
          </div>
          <aside aria-label="Price breakdown" className="grid content-start gap-3 rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Price breakdown</h2>
            <dl className="price grid grid-cols-[1fr_auto] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Price before GST</dt><dd className="text-right">{money(price - gst)}</dd>
              <dt className="text-muted-foreground">GST ({v.gst ?? 18}%)</dt><dd className="text-right">{money(gst)}</dd>
              <dt className="border-t pt-2 font-semibold">Customer pays</dt><dd className="border-t pt-2 text-right font-semibold">{money(price)}</dd>
            </dl>
            {discount > 0 && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Shows a {discount}% discount badge</p>}
          </aside>
        </TabsContent>

        <TabsContent value="inventory" className="pt-6">
          <div className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-3">
            <Field id="sku" label="SKU" error={err("sku")}><input {...register("sku")} {...a("sku")} className={`${input} font-mono`} /></Field>
            <Field id="stock" label="Units in stock" error={err("stock")} hint={product ? `${product.reserved} reserved for open orders. Use Inventory to record adjustments with a reason.` : undefined}><input {...register("stock", { valueAsNumber: true })} {...a("stock", true)} inputMode="numeric" className={input} /></Field>
            <Field id="reorderAt" label="Low-stock alert at" error={err("reorderAt")} hint="You'll be alerted at or below this many available units."><input {...register("reorderAt", { valueAsNumber: true })} {...a("reorderAt", true)} inputMode="numeric" className={input} /></Field>
          </div>
        </TabsContent>

        <TabsContent value="media" className="pt-6">
          <div className="grid gap-4 rounded-2xl border bg-card p-5">
            <div className="grid place-items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary"><ImagePlus className="size-6" aria-hidden="true" /></span>
              <p className="font-medium">Photos arrive with the media chapter</p>
              <p className="max-w-md text-sm text-muted-foreground">For now, add files to <code className="rounded bg-muted px-1">public/images/products/{v.slug || "slug"}.webp</code> and run <code className="rounded bg-muted px-1">pnpm images</code>. See docs/images.md.</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="grid gap-4 pt-6 lg:grid-cols-2">
          <div className="grid gap-4 rounded-2xl border bg-card p-5">
            <Field id="seoTitle" label="Search title" error={err("seoTitle")} hint={`${(v.seoTitle ?? "").length} / 70`}><input {...register("seoTitle")} {...a("seoTitle", true)} className={input} /></Field>
            <Field id="seoDescription" label="Search description" error={err("seoDescription")} hint={`${(v.seoDescription ?? "").length} / 160`}><textarea {...register("seoDescription")} {...a("seoDescription", true)} rows={4} className={`${input} h-auto py-2`} /></Field>
          </div>
          <aside aria-label="Search result preview" className="grid content-start gap-2 rounded-2xl border bg-card p-5">
            <h2 className="font-semibold">Search result preview</h2>
            <div className="rounded-xl border p-4"><p className="truncate text-xs text-emerald-800">shopkart.example › products › {v.slug || "your-slug"}</p><p className="mt-1 truncate text-lg text-blue-700">{v.seoTitle || v.title || "Product title"}</p><p className="line-clamp-2 text-sm text-muted-foreground">{v.seoDescription || v.description || "The description search engines show appears here."}</p></div>
          </aside>
        </TabsContent>
      </Tabs>
      {isDirty && !saved && <p className="text-xs text-muted-foreground">You have unsaved changes.</p>}
    </form>
  )
}
