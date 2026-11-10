import { describe, expect, it } from "vitest"

import { canViewRoute, navFor, requiredPermission } from "../../features/admin/access"
import { adminNav } from "../../features/admin/nav"
import { PERMISSIONS, can, type Role } from "../../lib/api/permissions"

const staff: Role[] = ["owner", "catalog_editor", "warehouse", "support", "finance"]
const allHrefs = adminNav.flatMap((g) => g.items.map((i) => i.href))
const titles = (role: Role) => navFor(role).flatMap((g) => g.items.map((i) => i.title))

describe("admin route access", () => {
  it("never lets a customer open any admin page", () => {
    for (const href of [...allHrefs, "/admin/orders/abc", "/admin/unknown"]) expect(canViewRoute("customer", href)).toBe(false)
    expect(navFor("customer")).toEqual([])
  })

  it("lets every staff role open the dashboard", () => {
    for (const role of staff) expect(canViewRoute(role, "/admin")).toBe(true)
  })

  it("lets the owner open everything, including unlisted paths", () => {
    for (const href of [...allHrefs, "/admin/orders/SK-1", "/admin/anything-new"]) expect(canViewRoute("owner", href)).toBe(true)
  })

  it("matches each role's permissions to the sections it can open", () => {
    expect(titles("warehouse")).toEqual(["Dashboard", "Inventory", "Orders"])
    expect(new Set(titles("finance"))).toEqual(new Set(["Dashboard", "Orders", "Customers", "Returns", "Coupons", "Reports", "Tax (GST)"]))
    expect(new Set(titles("catalog_editor"))).toEqual(new Set(["Dashboard", "Products", "Inventory", "Reviews", "Banners", "Articles"]))
    expect(canViewRoute("warehouse", "/admin/settings")).toBe(false)
    expect(canViewRoute("catalog_editor", "/admin/orders")).toBe(false)
    expect(canViewRoute("support", "/admin/orders/SK-1")).toBe(true) // nested pages follow their section
    expect(canViewRoute("support", "/admin/products")).toBe(false)
  })

  it("fails closed: unknown admin paths are owner-only", () => {
    expect(requiredPermission("/admin/secret-new-area")).toBe("settings:write")
    for (const role of staff.filter((r) => r !== "owner")) expect(canViewRoute(role, "/admin/secret-new-area")).toBe(false)
  })

  it("does not confuse look-alike prefixes", () => {
    expect(requiredPermission("/admin/productsX")).toBe("settings:write") // not treated as /admin/products
    expect(requiredPermission("/admin/products/")).toBe("catalog:write")
    expect(requiredPermission("/admin/orders/../settings")).toBe("orders:read") // the proxy path is already normalised; this only documents prefix matching
  })

  it("keeps the screen rules and the API rules in step: a section's permission is a real one", () => {
    for (const href of allHrefs) { const p = requiredPermission(href); if (p) expect(PERMISSIONS).toContain(p) }
    // every nav entry is reachable by at least one staff role
    for (const href of allHrefs) expect(staff.some((r) => canViewRoute(r, href))).toBe(true)
    expect(can("owner", "settings:write")).toBe(true)
  })

  it("never shows empty sidebar groups", () => {
    for (const role of staff) for (const g of navFor(role)) expect(g.items.length).toBeGreaterThan(0)
  })
})
