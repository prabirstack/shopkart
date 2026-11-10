"use client"
import { useState } from "react"
import { Mail, Send } from "lucide-react"

/** Layout-only for now: a later chapter connects it to a consent-aware signup API. */
export function NewsletterForm({ variant }: { variant: "band" | "footer" }) {
  const [message, setMessage] = useState("")
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("Newsletter signup is not connected yet.")
  }
  const field = (
    <form onSubmit={submit} className="flex min-w-0 flex-1 gap-2">
      <label htmlFor={`email-${variant}`} className="sr-only">Email address</label>
      <input id={`email-${variant}`} type="email" required placeholder="Enter your email"
        className={`h-10 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 ${variant === "footer" ? "border-white/20 bg-white/10 text-white placeholder:text-white/50" : "bg-background"}`} />
      <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        {variant === "band" ? "Subscribe" : <Send className="size-4" aria-label="Subscribe" />}
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
