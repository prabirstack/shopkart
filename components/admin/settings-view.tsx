"use client"
import { useState } from "react"
import { CheckCircle2, RotateCcw, Save, ShieldCheck, TriangleAlert } from "lucide-react"
import { ConfirmDialog } from "./confirm-dialog"
import { PageHeader } from "./page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useAdminReady } from "@/features/admin/hooks"
import { initialSettings } from "@/features/admin/seed"
import { useAdmin } from "@/features/admin/store"
import type { Settings } from "@/features/admin/types"

const field = "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
const CAPS = ["Products", "Inventory", "Orders", "Refunds", "Content", "Tax", "Reports", "Staff"] as const
const ROLES: [string, boolean[]][] = [
  ["Owner", [true, true, true, true, true, true, true, true]], ["Catalog editor", [true, false, false, false, true, false, false, false]], ["Warehouse", [false, true, true, false, false, false, false, false]],
  ["Support", [false, false, true, false, false, false, false, false]], ["Finance", [false, false, true, true, false, true, true, false]],
]

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border bg-card p-5 shadow-xs"><h2 className="font-semibold">{title}</h2>{description && <p className="mb-4 mt-0.5 text-sm text-muted-foreground">{description}</p>}<div className={description ? "" : "mt-4"}>{children}</div></section>
}

export function SettingsView() {
  const ready = useAdminReady()
  const saved = useAdmin((s) => s.settings)
  if (!ready) return <Skeleton className="h-[32rem] rounded-2xl" />
  // Mounted once data is loaded. Not re-keyed on save, so the "Saved" confirmation stays visible.
  return <Form initial={saved} />
}

function Form({ initial }: { initial: Settings }) {
  const save = useAdmin((s) => s.saveSettings)
  const reset = useAdmin((s) => s.resetDemo)
  const [s, setS] = useState<Settings>(initial)
  const [errs, setErrs] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [resetting, setResetting] = useState(false)
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => { setS((p) => ({ ...p, [k]: v })); setErrs((e) => ({ ...e, [k]: "" })); setDone(false) }
  const text = (k: "storeName" | "supportEmail" | "phone" | "gstin", label: string) => <div className="grid gap-1.5"><label htmlFor={k} className="text-sm font-medium">{label}</label><input id={k} value={s[k]} onChange={(e) => set(k, e.target.value)} aria-invalid={errs[k] ? true : undefined} className={field} />{errs[k] && <p role="alert" className="text-xs text-destructive">{errs[k]}</p>}</div>
  const numField = (k: "freeDeliveryAboveRupees" | "shippingFeeRupees" | "returnDays" | "lowStockDefault", label: string, hint?: string) => <div className="grid gap-1.5"><label htmlFor={k} className="text-sm font-medium">{label}</label><input id={k} inputMode="numeric" value={s[k]} onChange={(e) => set(k, Number(e.target.value.replace(/\D/g, "")))} aria-invalid={errs[k] ? true : undefined} className={field} />{errs[k] ? <p role="alert" className="text-xs text-destructive">{errs[k]}</p> : hint && <p className="text-xs text-muted-foreground">{hint}</p>}</div>
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); const er: Record<string, string> = {}
    if (s.storeName.trim().length < 2) er.storeName = "Enter your store name."
    if (!/^\S+@\S+\.\S+$/.test(s.supportEmail)) er.supportEmail = "Enter a valid email."
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(s.gstin.trim().toUpperCase())) er.gstin = "A GSTIN has 15 characters, like 29ABCDE1234F1Z5."
    if (s.returnDays < 1 || s.returnDays > 60) er.returnDays = "Between 1 and 60 days."
    setErrs(er); if (Object.keys(er).length) return
    save({ ...s, gstin: s.gstin.trim().toUpperCase() }); setDone(true)
  }
  const toggle = (k: "notifyNewOrder" | "notifyLowStock" | "notifyReturn", label: string, desc: string) => <li className="flex items-center justify-between gap-4 py-3"><div><label htmlFor={k} className="text-sm font-medium">{label}</label><p className="text-xs text-muted-foreground">{desc}</p></div><Switch id={k} checked={s[k]} onCheckedChange={(v) => set(k, v)} /></li>
  return (
    <form onSubmit={submit} noValidate className="grid gap-6">
      <PageHeader title="Store settings" description="Business details, delivery rules, payments and who can do what."><Button type="submit">{done ? <CheckCircle2 aria-hidden="true" /> : <Save aria-hidden="true" />}{done ? "Saved" : "Save settings"}</Button></PageHeader>
      <p role="status" className="text-sm text-emerald-700">{done ? "Settings saved." : ""}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Store profile" description="Shown on invoices and in customer emails."><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2">{text("storeName", "Store name")}</div>{text("supportEmail", "Support email")}{text("phone", "Support phone")}<div className="sm:col-span-2">{text("gstin", "GSTIN")}</div></div></Card>
        <Card title="Delivery and returns" description="The storefront and checkout read these same values."><div className="grid gap-4 sm:grid-cols-2">{numField("freeDeliveryAboveRupees", "Free delivery above (₹)")}{numField("shippingFeeRupees", "Delivery fee below that (₹)")}{numField("returnDays", "Return window (days)", "How long after delivery a return is accepted.")}{numField("lowStockDefault", "Default low-stock alert", "Used for new products.")}</div></Card>
        <Card title="Payments" description="Razorpay Standard Checkout. API keys are set as server environment variables, never typed here.">
          <div role="radiogroup" aria-label="Razorpay mode" className="grid gap-2 sm:grid-cols-2">{(["test", "live"] as const).map((m) => <label key={m} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${s.razorpayMode === m ? "border-primary bg-primary/5" : ""}`}><input type="radio" name="mode" checked={s.razorpayMode === m} onChange={() => set("razorpayMode", m)} className="mt-1 accent-primary" /><span><span className="block font-medium capitalize">{m} mode</span><span className="text-xs text-muted-foreground">{m === "test" ? "No real money moves." : "Real customers are charged."}</span></span></label>)}</div>
          {s.razorpayMode === "live" && <p role="alert" className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> Only switch to live after a full test purchase, refund and webhook check.</p>}
        </Card>
        <Card title="Notifications" description="Email alerts for the owner."><ul className="divide-y">{toggle("notifyNewOrder", "New orders", "When a payment is confirmed.")}{toggle("notifyLowStock", "Low stock", "When a product reaches its alert level.")}{toggle("notifyReturn", "Return requests", "When a customer asks to return an item.")}</ul></Card>
      </div>
      <Card title="Team and permissions" description="Each role gets only the capabilities it needs. The server checks these on every action, not just the menu.">
        <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-left text-sm"><caption className="sr-only">Role permissions</caption><thead><tr className="border-b text-xs uppercase tracking-wide text-muted-foreground"><th className="py-2 font-medium">Role</th>{CAPS.map((c) => <th key={c} className="px-2 text-center font-medium">{c}</th>)}</tr></thead>
          <tbody>{ROLES.map(([role, caps]) => <tr key={role} className="border-b last:border-0"><td className="py-3 font-medium"><span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden="true" />{role}</span></td>{caps.map((on, i) => <td key={i} className="px-2 text-center">{on ? <><CheckCircle2 className="mx-auto size-4 text-emerald-600" aria-hidden="true" /><span className="sr-only">Allowed</span></> : <><span aria-hidden="true" className="text-muted-foreground/40">–</span><span className="sr-only">Not allowed</span></>}</td>)}</tr>)}</tbody></table></div>
      </Card>
      <Card title="Demo data" description="Everything in this admin runs on sample data stored in your browser."><Button type="button" variant="outline" onClick={() => setResetting(true)}><RotateCcw aria-hidden="true" /> Reset demo data</Button></Card>
      <ConfirmDialog open={resetting} onOpenChange={setResetting} title="Reset all demo data?" description="Products, orders, coupons, banners and settings go back to the original samples. Your edits in this browser are lost." confirmLabel="Reset demo data" onConfirm={() => { reset(); setS(initialSettings); setErrs({}); setDone(false) }} />
    </form>
  )
}
