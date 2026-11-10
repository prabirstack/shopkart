"use client"
import Link from "next/link"
import { Cookie } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ANALYTICS_ENABLED } from "./config"
import { setConsent, useConsent } from "./consent"

/** Appears only when analytics is configured and the visitor hasn't chosen yet. */
export function ConsentBanner() {
  const consent = useConsent()
  if (!ANALYTICS_ENABLED || consent !== null) return null
  return (
    <section role="region" aria-label="Cookie consent" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border bg-card p-4 shadow-xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Cookie className="hidden size-8 shrink-0 text-primary sm:block" aria-hidden="true" />
        <p className="flex-1 text-sm">
          We use optional analytics cookies to see which pages and products people use, so we can improve the store. Essential cookies for your cart always stay on.{" "}
          <Link href="/cookies" className="font-medium underline underline-offset-4">Cookie policy</Link>
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setConsent("denied")}>Essential only</Button>
          <Button onClick={() => setConsent("granted")}>Accept analytics</Button>
        </div>
      </div>
    </section>
  )
}
