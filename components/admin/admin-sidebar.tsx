"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ExternalLink, ShoppingBag } from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar"
import { navFor } from "@/features/admin/access"
import type { Role } from "@/lib/api/permissions"
import { useAdminReady } from "@/features/admin/hooks"
import { useAdmin } from "@/features/admin/store"
import { useReviewStore } from "@/features/reviews/store"

export function AdminSidebar({ role }: { role: Role }) {
  const pathname = usePathname()
  const ready = useAdminReady()
  const orders = useAdmin((s) => s.orders)
  const products = useAdmin((s) => s.products)
  const returns = useAdmin((s) => s.returns)
  const userReviews = useReviewStore((s) => s.reviews)
  const counts = {
    orders: ready ? orders.filter((o) => o.status === "pending" || o.status === "paid").length : 0,
    stock: ready ? products.filter((p) => p.status !== "archived" && p.stock - p.reserved <= p.reorderAt).length : 0,
    returns: ready ? returns.filter((r) => r.status === "requested").length : 0,
    reviews: ready ? userReviews.filter((r) => r.status === "pending").length : 0,
  }
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href))
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu><SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild tooltip="ShopKart Admin">
            <Link href="/admin">
              <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"><ShoppingBag className="size-4" aria-hidden="true" /></span>
              <span className="grid text-left leading-tight"><span className="font-semibold">ShopKart</span><span className="text-xs text-muted-foreground">Admin console</span></span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem></SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navFor(role).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map(({ title, href, icon: Icon, badge }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={isActive(href)} tooltip={title}>
                      <Link href={href}><Icon aria-hidden="true" /><span>{title}</span></Link>
                    </SidebarMenuButton>
                    {badge && counts[badge] > 0 && <SidebarMenuBadge className="bg-primary/10 font-semibold text-primary">{counts[badge]}<span className="sr-only"> need attention</span></SidebarMenuBadge>}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu><SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="View storefront"><Link href="/" target="_blank"><ExternalLink aria-hidden="true" /><span>View storefront</span></Link></SidebarMenuButton>
        </SidebarMenuItem></SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
