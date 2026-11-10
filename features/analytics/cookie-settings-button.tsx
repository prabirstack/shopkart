"use client"
import { Button } from "@/components/ui/button"
import { ANALYTICS_ENABLED } from "./config"
import { setConsent, useConsent } from "./consent"

export function CookieSettingsButton({ className }: { className?: string }) {
  const consent = useConsent()
  if (!ANALYTICS_ENABLED) return <p className="text-sm text-muted-foreground">Analytics is not enabled on this site, so there is nothing to change.</p>
  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground" role="status">Current choice: {consent === "granted" ? "analytics accepted" : consent === "denied" ? "essential only" : "not chosen yet"}.</p>
      <div><Button type="button" variant="outline" className={className} onClick={() => setConsent(null)}>Change cookie choice</Button></div>
    </div>
  )
}
