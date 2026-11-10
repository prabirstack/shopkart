// Server-side data access. Each function returns plain DTOs, enforces its business rules inside
// a transaction where it matters, and never exposes raw rows to pages. Callers must authorise the
// actor first: these functions take an actor id for auditing but do not decide who may call them.
export * from "./catalog"
export * from "./reviews"
export * from "./articles"
export * from "./inventory"
export * from "./coupons"
export * from "./orders"
export * from "./banners"
export * from "./settings"
export * from "./identity"
export * from "./admin"
export * from "./admin-views"
export * from "./storefront-content"
export * from "./storefront-checkout"
export * from "./storefront-account"
export * from "./errors"
export type * from "./types"
