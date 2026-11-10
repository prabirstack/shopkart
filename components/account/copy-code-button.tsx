"use client"
import { useState } from "react"
import { Check, Copy } from "lucide-react"

export function CopyCodeButton({ code, disabled }: { code: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <>
      <button type="button" disabled={disabled} onClick={async () => {
        try { await navigator.clipboard.writeText(code); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { /* clipboard blocked */ }
      }} className="inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
        {copied ? <Check className="size-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        {copied ? "Copied" : "Copy code"}
      </button>
      <span role="status" className="sr-only">{copied ? `${code} copied.` : ""}</span>
    </>
  )
}
