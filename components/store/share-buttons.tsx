"use client"
import { useState, useSyncExternalStore } from "react"
import { Check, Link2, Mail, MessageCircle, Send, Share2 } from "lucide-react"

const noop = () => () => {}

export function ShareButtons({ title }: { title: string }) {
  // Real page address, read on the client only so server and client markup match.
  const url = useSyncExternalStore(noop, () => window.location.href, () => "")
  const [copied, setCopied] = useState(false)
  const text = `Check out ${title} on ShopKart`
  const enc = encodeURIComponent
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url}`)}`, icon: MessageCircle, cls: "text-emerald-600" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, icon: Share2, cls: "text-blue-600" },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, icon: Send, cls: "text-foreground" },
    { label: "Email", href: `mailto:?subject=${enc(text)}&body=${enc(`${text}\n${url}`)}`, icon: Mail, cls: "text-amber-600" },
  ]
  const btn = "inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm font-medium hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">Share</span>
      {links.map(({ label, href, icon: Icon, cls }) => (
        <a key={label} href={url ? href : undefined} aria-disabled={!url} target="_blank" rel="noopener noreferrer" className={btn}>
          <Icon className={`size-4 ${cls}`} aria-hidden="true" /> {label}<span className="sr-only"> (opens in a new tab)</span>
        </a>
      ))}
      <button type="button" className={btn} onClick={async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); window.setTimeout(() => setCopied(false), 2000) } catch { /* clipboard blocked */ }
      }}>
        {copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <span role="status" className="sr-only">{copied ? "Link copied to clipboard." : ""}</span>
    </div>
  )
}
