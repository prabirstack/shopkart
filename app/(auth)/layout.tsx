import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowLeft, ShoppingBag } from "lucide-react"
import { SITE_NAME } from "@/lib/site"

const facts = [
  ["Favorites", "Save the products you love and come back whenever you're ready."],
  ["Orders", "Track deliveries, view invoices and manage your purchases."],
  ["Your account", "Keep your addresses and preferences together in one secure place."],
] as const

/**
 * Sign-in, sign-up and password pages: a quiet two-column screen. A dark brand panel with diagonal hairlines on the
 * left (hidden on small screens), the form on the right. No storefront header, menus, cart or footer.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-shell grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-neutral-950 p-10 text-neutral-300 lg:flex">
        {/* Diagonal hairlines at 45 degrees, fading out toward the bottom. Pure CSS lines: no blur, no gradient fills. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 [background-image:repeating-linear-gradient(45deg,rgb(255_255_255/0.07)_0,rgb(255_255_255/0.07)_1px,transparent_1px,transparent_18px)] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <Link href="/" className="relative flex w-fit items-center gap-2.5 text-white focus-visible:ring-[3px] focus-visible:ring-white/40" aria-label={`${SITE_NAME} home`}>
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground"><ShoppingBag className="size-4" aria-hidden="true" /></span>
          <span className="text-lg font-semibold tracking-tight">{SITE_NAME}</span>
        </Link>
        <div className="relative max-w-md">
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Welcome to ShopKart</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-white">Your next great find starts here.</h2>
          <dl className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {facts.map(([term, text]) => (
              <div key={term} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4 py-4 text-sm">
                <dt className="text-xs uppercase tracking-wider text-neutral-500">{term}</dt>
                <dd className="leading-relaxed text-neutral-400">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="relative text-xs text-neutral-600">© 2026 {SITE_NAME}</p>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between px-6 sm:px-12">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight lg:invisible" aria-label={`${SITE_NAME} home`}>
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"><ShoppingBag className="size-4" aria-hidden="true" /></span>
            {SITE_NAME}
          </Link>
          <Link href="/" className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" /> Back to store
          </Link>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
        <footer className="shrink-0 px-6 py-6 text-xs text-muted-foreground sm:px-12">
          <div className="mx-auto w-full max-w-sm">
          <Link href="/terms" className="underline-offset-4 hover:underline">Terms</Link> · <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy</Link> · <Link href="/help" className="underline-offset-4 hover:underline">Help</Link>
          </div>
        </footer>
      </div>
    </div>
  )
}
