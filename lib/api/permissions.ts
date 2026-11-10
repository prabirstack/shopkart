export type Role = "customer" | "owner" | "catalog_editor" | "warehouse" | "support" | "finance"

/** Every action a staff role can be granted. The owner can do everything. Customers have none. */
export const PERMISSIONS = [
  "catalog:write", "inventory:read", "inventory:write", "orders:read", "orders:fulfil", "orders:cancel",
  "reviews:moderate", "content:write", "coupons:write", "banners:write", "customers:read", "returns:manage", "settings:write", "reports:read",
] as const
export type Permission = (typeof PERMISSIONS)[number]

/** What each staff role may do. Shown on the settings page and enforced by `can`. */
export const ROLE_PERMISSIONS: Record<Exclude<Role, "customer">, readonly Permission[]> = {
  owner: PERMISSIONS,
  catalog_editor: ["catalog:write", "content:write", "banners:write", "reviews:moderate", "inventory:read"],
  warehouse: ["inventory:read", "inventory:write", "orders:read", "orders:fulfil"],
  support: ["orders:read", "orders:cancel", "customers:read", "returns:manage", "reviews:moderate"],
  finance: ["orders:read", "reports:read", "coupons:write", "returns:manage", "customers:read"],
}

export const can = (role: Role, permission: Permission) => role !== "customer" && ROLE_PERMISSIONS[role].includes(permission)
export const isStaff = (role: Role) => role !== "customer"
