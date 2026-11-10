"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"

/** Unsubscribing is a deliberate click (a POST), so email link scanners that open links can't unsubscribe anyone. */
export function UnsubscribeButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "invalid" | "error">("idle")
  if (!token) return <p role="alert" className="text-sm text-destructive">This unsubscribe link is incomplete. Use the link from the email you received.</p>
  const go = async () => {
    setState("busy")
    try {
      const res = await fetch("/api/v1/newsletter/unsubscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) })
      setState(res.ok ? "done" : res.status === 404 ? "invalid" : "error")
    } catch { setState("error") }
  }
  if (state === "done") return <p role="status" className="rounded-xl border bg-emerald-50 p-4 text-sm text-emerald-900">You&apos;re unsubscribed. You won&apos;t get any more newsletters from us.</p>
  return (
    <div className="grid max-w-md gap-4 rounded-2xl border bg-card p-6">
      <p className="text-sm text-muted-foreground">Click below to stop receiving our newsletters. You can sign up again any time from the bottom of any page.</p>
      <Button type="button" onClick={() => void go()} disabled={state === "busy"} className="w-fit">{state === "busy" ? "Unsubscribing…" : "Unsubscribe me"}</Button>
      {state === "invalid" && <p role="alert" className="text-sm text-destructive">This unsubscribe link isn&apos;t valid.</p>}
      {state === "error" && <p role="alert" className="text-sm text-destructive">Something went wrong. Please try again.</p>}
    </div>
  )
}
