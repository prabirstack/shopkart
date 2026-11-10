export type Role = "customer" | "owner" | "catalog_editor" | "warehouse" | "support" | "finance"

/** What each staff role may do. The owner can do everything. Customers have no admin permissions. */
export const PERMISSIONS = [
  "catalog:write", "inventory:read", "inventory:write", "orders:read", "orders:fulfil", "orders:cancel",
  "reviews:moderate", "content:write", "coupons:write", "banners:write", "customers:read", "returns:manage", "settings:write", "reports:read",
] as const
export type Permission = (typeof PERMISSIONS)[number]

const MATRIX: Record<Exclude<Role, "customer">, readonly Permission[]> = {
  owner: PERMISSIONS,
  catalog_editor: ["catalog:write", "content:write", "banners:write", "reviews:moderate", "inventory:read"],
  warehouse: ["inventory:read", "inventory:write", "orders:read", "orders:fulfil"],
  support: ["orders:read", "orders:cancel", "customers:read", "returns:manage", "reviews:moderate"],
  finance: ["orders:read", "reports:read", "coupons:write", "returns:manage", "customers:read"],
}

export const can = (role: Role, permission: Permission) => role !== "customer" && MATRIX[role].includes(permission)
export const isStaff = (role: Role) => role !== "customer"
