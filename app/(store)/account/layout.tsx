import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"
import { Headphones } from "lucide-react"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { AccountNav } from "@/components/account/account-nav"
import { demoUser } from "@/features/account/demo"

export const metadata: Metadata = { title: "My account", robots: { index: false } }

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 lg:sticky lg:top-4 lg:self-start">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="relative bg-gradient-to-br from-neutral-950 via-red-950 to-primary p-5 text-white">
            <span aria-hidden="true" className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
            <div className="relative flex items-center gap-3">
              <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-lg font-bold text-primary ring-4 ring-white/25">{demoUser.name[0]}</span>
              <div className="min-w-0"><p className="truncate font-semibold">{demoUser.name}</p><p className="truncate text-xs text-white/70">{demoUser.email}</p></div>
            </div>
            <p className="relative mt-3 text-xs text-white/70">Member since {demoUser.joined}</p>
          </div>
          <div className="hidden lg:block"><AccountNav /></div>
          <div className="hidden border-t p-2 lg:block">
            <Link href="/help" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted"><span className="grid size-8 place-items-center rounded-lg bg-muted"><Headphones className="size-4" aria-hidden="true" /></span>Help &amp; support</Link>
            <SignOutButton className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground/80 hover:bg-muted" />
          </div>
        </div>
        <div className="lg:hidden"><AccountNav /></div>
      </aside>
      <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">
        <p role="note" className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-2 text-xs text-amber-900">You're signed in. The profile and order history shown here are still sample data until the pages move to the database.</p>
        {children}
      </main>
    </div>
  )
}
