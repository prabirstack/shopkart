import type { Metadata } from "next"
import type { ReactNode } from "react"
import { AccountNav } from "@/components/account/account-nav"
import { demoUser } from "@/features/account/demo"

export const metadata: Metadata = { title: "My account", robots: { index: false } }

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="grid content-start gap-4">
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-full bg-primary/10 text-lg font-semibold text-primary">{demoUser.name[0]}</span>
          <div className="min-w-0"><p className="truncate text-sm font-semibold">{demoUser.name}</p><p className="truncate text-xs text-muted-foreground">{demoUser.email}</p></div>
        </div>
        <AccountNav />
      </aside>
      <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-5">
        <p role="note" className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">Demo account with sample data. Sign-in and real order history arrive in the identity chapters.</p>
        {children}
      </main>
    </div>
  )
}
