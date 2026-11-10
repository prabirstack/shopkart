"use client"
import { useState } from "react"
import { Check, Mail, Send } from "lucide-react"

/** Newsletter signup. Stores the address (see /api/v1/newsletter); every outcome reads the same so it can't reveal who is subscribed. */
export function NewsletterForm({ variant }: { variant: "band" | "footer" }) {
  const [message, setMessage] = useState("")
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (busy) return
    const form = new FormData(e.currentTarget)
    setBusy(true); setMessage("")
    try {
      const res = await fetch("/api/v1/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), website: form.get("website") ?? "", source: variant === "band" ? "band" : "footer" }) })
      if (res.ok) { setDone(true); setMessage("You're on the list. We'll let you know about new arrivals and deals.") }
      else setMessage(res.status === 429 ? "Too many attempts. Please try again in a few minutes." : res.status === 422 ? "Enter a valid email address." : "Couldn't sign you up. Please try again.")
    } catch { setMessage("Couldn't reach the server. Check your connection.") } finally { setBusy(false) }
  }
  const field = (
    <form onSubmit={submit} className="flex min-w-0 flex-1 gap-2">
      <label htmlFor={`email-${variant}`} className="sr-only">Email address</label>
      <input id={`email-${variant}`} name="email" type="email" required maxLength={254} placeholder="Enter your email" autoComplete="email" disabled={done}
        className={`h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-60 ${variant === "footer" ? "border-white/20 bg-white/10 text-white placeholder:text-white/50" : "bg-background"}`} />
      {/* Honeypot for bots; real people never see or fill it. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <button type="submit" disabled={busy || done} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-70">
        {done ? <Check className="size-4" aria-label="Subscribed" /> : variant === "band" ? (busy ? "Subscribing…" : "Subscribe") : <Send className="size-4" aria-label="Subscribe" />}
      </button>
    </form>
  )
  if (variant === "footer") {
    return <div>{field}<p role="status" className="mt-2 text-xs text-white/70">{message}</p></div>
  }
  return (
    <section aria-label="Newsletter" className="flex flex-col gap-3 rounded-xl bg-primary/10 p-4 lg:flex-row lg:items-center lg:gap-6">
      <h2 className="flex items-center gap-2 text-xl font-bold"><Mail className="size-7 text-primary" aria-hidden="true" /> Stay in the Loop!</h2>
      <p className="text-sm text-muted-foreground lg:flex-1">Get the latest deals, new arrivals and exclusive offers straight to your inbox.</p>
      <div className="lg:w-[28rem]">{field}<p role="status" className="mt-1 text-xs text-muted-foreground">{message}</p></div>
    </section>
  )
}
