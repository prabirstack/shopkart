"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Bell, LogOut, MessageSquare, Search, Settings, ShoppingBag, User } from "lucide-react"
import { AdminBreadcrumbs } from "./admin-breadcrumbs"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { AdminCounts } from "@/lib/db/queries/admin-views"
import { authClient } from "@/lib/auth-client"

export type AdminUser = { name: string; email: string; roleLabel: string }

export function AdminTopbar({ user, counts }: { user: AdminUser; counts: AdminCounts }) {
  const router = useRouter()
  const pending = counts.pendingPayment
  const pendingReviews = counts.reviews
  const low = counts.lowItems
  const alerts = pending + counts.stock + pendingReviews
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur">
      <SidebarTrigger aria-label="Toggle sidebar" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="hidden min-w-0 md:block"><AdminBreadcrumbs /></div>
      <form action="/admin/products" method="get" role="search" className="relative ml-auto w-full max-w-xs">
        <label htmlFor="admin-search" className="sr-only">Search products</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input id="admin-search" name="q" type="search" placeholder="Search products or SKU…" className="h-9 w-full rounded-lg border bg-muted/40 pl-9 pr-3 text-sm outline-none focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/40" />
      </form>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label={`Notifications${alerts ? `, ${alerts} new` : ""}`} className="relative grid size-9 place-items-center rounded-lg hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <Bell className="size-5" aria-hidden="true" />
          {alerts > 0 && <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold leading-4 text-primary-foreground">{alerts}</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Needs your attention</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {alerts === 0 && <p className="px-2 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>}
          {pending > 0 && <DropdownMenuItem asChild><Link href="/admin/orders?status=pending"><ShoppingBag aria-hidden="true" /> {pending} {pending === 1 ? "order is" : "orders are"} waiting for payment</Link></DropdownMenuItem>}
          {pendingReviews > 0 && <DropdownMenuItem asChild><Link href="/admin/reviews"><MessageSquare aria-hidden="true" /> {pendingReviews} {pendingReviews === 1 ? "review is" : "reviews are"} awaiting approval</Link></DropdownMenuItem>}
          {low.map((p) => <DropdownMenuItem key={p.title} asChild><Link href="/admin/inventory"><AlertTriangle className="text-amber-600" aria-hidden="true" /> <span className="truncate">{p.title}: {p.available} left</span></Link></DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Account menu" className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-medium">{user.name}</span><span className="block text-xs text-muted-foreground">{user.roleLabel}</span></span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link href="/admin/settings"><Settings aria-hidden="true" /> Store settings</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href="/account/profile"><User aria-hidden="true" /> My profile</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={async () => { await authClient.signOut(); router.push("/login"); router.refresh() }}><LogOut aria-hidden="true" /> Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
