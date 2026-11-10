import type { Metadata } from "next"
import Link from "next/link"
import { Suspense, type ReactNode } from "react"
import { Headphones } from "lucide-react"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { AccountNav } from "@/components/account/account-nav"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMonthYear } from "@/features/account/orders"
import { requireUser } from "@/features/account/session"

// The account area is personal: the layout reads the signed-in user on every request, so there is no static
// shell to prerender. Without this, Next flags the session check (which looks at the current time) during validation.
export const instant = false

export const metadata: Metadata = { title: "My account", robots: { index: false } }

const cardClass = "relative bg-gradient-to-br from-neutral-950 via-red-950 to-primary p-5 text-white"

/** The signed-in person's card. It reads the session, so it streams in behind a placeholder and the rest of the shell stays static. */
async function UserCard() {
  const user = await requireUser("/account")
  return (
    <div className={cardClass}>
      <span aria-hidden="true" className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-full bg-white text-lg font-bold text-primary ring-4 ring-white/25">{user.name.trim()[0]?.toUpperCase() ?? "?"}</span>
        <div className="min-w-0"><p className="truncate font-semibold">{user.name}</p><p className="truncate text-xs text-white/70">{user.email}</p></div>
      </div>
      <p className="relative mt-3 text-xs text-white/70">Member since {formatMonthYear(user.createdAt)}</p>
    </div>
  )
}

function UserCardFallback() {
  return (
    <div className={cardClass} aria-busy="true" aria-label="Loading your details">
      <div className="relative flex items-center gap-3"><Skeleton className="size-12 rounded-full bg-white/20" /><div className="grid gap-2"><Skeleton className="h-4 w-32 bg-white/20" /><Skeleton className="h-3 w-40 bg-white/20" /></div></div>
      <Skeleton className="relative mt-3 h-3 w-36 bg-white/20" />
    </div>
  )
}

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="store-container grid grid-cols-[minmax(0,1fr)] gap-6 py-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 lg:sticky lg:top-4 lg:self-start">
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <Suspense fallback={<UserCardFallback />}><UserCard /></Suspense>
          <div className="hidden lg:block"><AccountNav /></div>
          <div className="hidden border-t p-2 lg:block">
            <Link href="/help" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground/80 hover:bg-muted"><span className="grid size-8 place-items-center rounded-lg bg-muted"><Headphones className="size-4" aria-hidden="true" /></span>Help &amp; support</Link>
            <SignOutButton className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-foreground/80 hover:bg-muted" />
          </div>
        </div>
        <div className="lg:hidden"><AccountNav /></div>
      </aside>
      <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-6">{children}</main>
    </div>
  )
}
