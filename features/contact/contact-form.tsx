"use client"
import { useEffect, useId, useState } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CONTACT_TOPICS } from "./topics"

const input = "w-full rounded-xl border bg-background px-3.5 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground/70 hover:border-primary/40 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 aria-[invalid=true]:border-destructive"

type FieldErrors = Record<string, string>

/** The contact form. Messages are stored and read by staff in the admin Inbox. */
export function ContactForm() {
  const uid = useId()
  const [fields, setFields] = useState({ name: "", email: "" })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState<{ reference: string; email: string } | null>(null)

  // Signed-in shoppers don't need to retype who they are.
  useEffect(() => {
    let live = true
    fetch("/api/v1/me").then((r) => (r.ok ? r.json() : null)).then((j) => { if (live && j?.data) setFields((f) => ({ name: f.name || j.data.name, email: f.email || j.data.email })) }).catch(() => undefined)
    return () => { live = false }
  }, [])

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    const form = new FormData(e.currentTarget)
    const body = Object.fromEntries(form.entries()) as Record<string, string>
    setBusy(true); setErrors({}); setFormError("")
    try {
      const res = await fetch("/api/v1/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json().catch(() => null)
      if (res.ok) { setSent({ reference: json.data.reference, email: body.email }); return }
      if (res.status === 422 && Array.isArray(json?.error?.details)) setErrors(Object.fromEntries(json.error.details.map((d: { path: string; message: string }) => [d.path, d.message])))
      setFormError(res.status === 429 ? "You've sent a few messages already. Please wait a few minutes and try again." : res.status === 422 ? "Please fix the highlighted fields." : "We couldn't send your message. Please try again.")
    } catch { setFormError("Couldn't reach the server. Check your connection and try again.") } finally { setBusy(false) }
  }

  if (sent) {
    return (
      <div role="status" className="grid justify-items-center gap-3 rounded-2xl border bg-muted/30 px-6 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="size-7" aria-hidden="true" /></span>
        <h3 className="text-xl font-semibold">Message sent</h3>
        <p className="max-w-sm text-sm text-muted-foreground">Thanks. Our team will reply to <strong className="text-foreground">{sent.email}</strong>, usually within one working day.</p>
        <p className="rounded-full border bg-background px-3 py-1 font-mono text-xs">Reference {sent.reference}</p>
        <button type="button" onClick={() => setSent(null)} className="text-sm font-medium text-primary hover:underline">Send another message</button>
      </div>
    )
  }

  const id = (n: string) => `${uid}-${n}`
  const a = (n: string) => ({ id: id(n), name: n, "aria-invalid": errors[n] ? true : undefined, "aria-describedby": errors[n] ? `${id(n)}-err` : undefined })
  const err = (n: string) => errors[n] && <p id={`${id(n)}-err`} role="alert" className="text-xs text-destructive">{errors[n]}</p>

  return (
    <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2" noValidate>
      <div className="grid content-start gap-1.5"><label htmlFor={id("name")} className="text-sm font-medium">Your name <span aria-hidden="true" className="text-destructive">*</span></label>
        <input {...a("name")} value={fields.name} onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))} required autoComplete="name" maxLength={80} className={`${input} h-11`} />{err("name")}</div>
      <div className="grid content-start gap-1.5"><label htmlFor={id("email")} className="text-sm font-medium">Email <span aria-hidden="true" className="text-destructive">*</span></label>
        <input {...a("email")} type="email" value={fields.email} onChange={(e) => setFields((f) => ({ ...f, email: e.target.value }))} required autoComplete="email" maxLength={254} className={`${input} h-11`} />{err("email")}</div>
      <div className="grid content-start gap-1.5 sm:col-span-2"><label htmlFor={id("topic")} className="text-sm font-medium">Topic <span aria-hidden="true" className="text-destructive">*</span></label>
        <div className="relative"><select {...a("topic")} required defaultValue="" className={`${input} h-11 cursor-pointer appearance-none pr-10`}><option value="" disabled>Choose…</option>{CONTACT_TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div>{err("topic")}</div>
      <div className="grid content-start gap-1.5 sm:col-span-2"><label htmlFor={id("orderNumber")} className="text-sm font-medium">Order number (optional)</label>
        <input {...a("orderNumber")} maxLength={12} placeholder="SK-10482" className={`${input} h-11`} />{err("orderNumber") ?? <p className="text-xs text-muted-foreground">For example SK-10482</p>}</div>
      <div className="grid content-start gap-1.5 sm:col-span-2"><label htmlFor={id("message")} className="text-sm font-medium">How can we help? <span aria-hidden="true" className="text-destructive">*</span></label>
        <textarea {...a("message")} required rows={5} maxLength={2000} className={`${input} min-h-32 resize-y py-3`} />{err("message")}</div>
      {/* Honeypot: invisible to people, tempting to bots. Anything typed here means the message is dropped. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Leave this empty<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      {formError && <p role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:col-span-2"><AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{formError}</p>}
      <div className="sm:col-span-2"><Button type="submit" size="lg" disabled={busy} className="h-11 w-full rounded-xl text-base font-semibold shadow-md shadow-primary/25 sm:w-auto sm:px-8">{busy && <Loader2 className="animate-spin" aria-hidden="true" />}{busy ? "Sending…" : "Send message"}</Button></div>
    </form>
  )
}
