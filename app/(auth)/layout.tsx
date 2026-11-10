import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { SITE_NAME } from "@/lib/site"

/**
 * Sign-in, sign-up and password pages get their own focused layout: just the brand, a way back, and the form.
 * No storefront header, menus, cart or footer, so there is nothing to distract from signing in.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="store-container flex h-16 shrink-0 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 rounded-lg font-bold tracking-tight focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label={`${SITE_NAME} home`}>
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-primary/75 text-primary-foreground shadow-md shadow-primary/25"><ShoppingBag className="size-5" aria-hidden="true" /></span>
          <span className="text-xl">{SITE_NAME}</span>
        </Link>
        <Link href="/" className="group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> Back to store
        </Link>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
      <footer className="store-container shrink-0 py-6 text-center text-xs text-muted-foreground">
        © 2026 {SITE_NAME} · <Link href="/terms" className="underline-offset-4 hover:underline">Terms</Link> · <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy</Link> · <Link href="/help" className="underline-offset-4 hover:underline">Help</Link>
      </footer>
    </div>
  )
}
