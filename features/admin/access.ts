import { adminNav, type AdminNavGroup } from "./nav"
import { can, isStaff, type Permission, type Role } from "@/lib/api/permissions"

/**
 * Which permission a staff member needs to open each admin section. The same matrix guards the
 * /api/v1/admin endpoints (lib/api/permissions.ts), so the screen and the data can't disagree.
 * The dashboard is open to every staff role; anything not listed here is owner-only (fail closed).
 */
const SECTION_PERMISSION: [prefix: string, permission: Permission][] = [
  ["/admin/products", "catalog:write"],
  ["/admin/inventory", "inventory:read"],
  ["/admin/reviews", "reviews:moderate"],
  ["/admin/orders", "orders:read"],
  ["/admin/returns", "returns:manage"],
  ["/admin/customers", "customers:read"],
  ["/admin/inbox", "inbox:manage"],
  ["/admin/coupons", "coupons:write"],
  ["/admin/banners", "banners:write"],
  ["/admin/articles", "content:write"],
  ["/admin/reports", "reports:read"],
  ["/admin/tax", "reports:read"],
  ["/admin/settings", "settings:write"],
]

/** Permission needed for a path, or null when any staff member may open it (the dashboard). */
export function requiredPermission(pathname: string): Permission | null {
  const path = pathname.replace(/\/+$/, "") || "/"
  if (path === "/admin") return null
  const hit = SECTION_PERMISSION.find(([prefix]) => path === prefix || path.startsWith(prefix + "/"))
  return hit ? hit[1] : "settings:write" // unknown admin path: owner only
}

export function canViewRoute(role: Role, pathname: string): boolean {
  if (!isStaff(role)) return false
  const needed = requiredPermission(pathname)
  return needed === null || can(role, needed)
}

/** The sidebar for one role: only sections they may open, and no empty groups. */
export function navFor(role: Role): AdminNavGroup[] {
  return adminNav.map((g) => ({ ...g, items: g.items.filter((i) => canViewRoute(role, i.href)) })).filter((g) => g.items.length > 0)
}

export const ROLE_LABELS: Record<Role, string> = { customer: "Customer", owner: "Owner", catalog_editor: "Catalog editor", warehouse: "Warehouse", support: "Support", finance: "Finance" }
