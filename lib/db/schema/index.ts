export * from "./enums"
export * from "./identity"
export * from "./catalog"
export * from "./inventory"
export * from "./sales"
export * from "./content"
export * from "./system"

import type { InferInsertModel, InferSelectModel } from "drizzle-orm"
import { addresses, users } from "./identity"
import { brands, categories, products } from "./catalog"
import { stockMovements } from "./inventory"
import { coupons, orderEvents, orderItems, orders, payments, returns } from "./sales"
import { articles, banners, reviews } from "./content"

export type User = InferSelectModel<typeof users>
export type NewUser = InferInsertModel<typeof users>
export type Address = InferSelectModel<typeof addresses>
export type Brand = InferSelectModel<typeof brands>
export type Category = InferSelectModel<typeof categories>
export type Product = InferSelectModel<typeof products>
export type NewProduct = InferInsertModel<typeof products>
export type StockMovement = InferSelectModel<typeof stockMovements>
export type Coupon = InferSelectModel<typeof coupons>
export type Order = InferSelectModel<typeof orders>
export type OrderItem = InferSelectModel<typeof orderItems>
export type OrderEvent = InferSelectModel<typeof orderEvents>
export type Payment = InferSelectModel<typeof payments>
export type Return = InferSelectModel<typeof returns>
export type Review = InferSelectModel<typeof reviews>
export type Article = InferSelectModel<typeof articles>
export type Banner = InferSelectModel<typeof banners>
