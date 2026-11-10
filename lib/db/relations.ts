import { defineRelations } from "drizzle-orm";

import * as schema from "./schema";

// Enables db.query.<table>.findMany({ with: { ... } }).
// Drizzle v1 defines every relation in one place; the "one" and "many" sides
// no longer need to be declared in pairs.
export const relations = defineRelations(schema, (r) => ({
  users: {
    orders: r.many.orders({
      from: r.users.id,
      to: r.orders.userId,
    }),
  },

  categories: {
    products: r.many.products({
      from: r.categories.id,
      to: r.products.categoryId,
    }),
  },

  products: {
    // categoryId is nullable (set null on category delete), so this stays optional.
    category: r.one.categories({
      from: r.products.categoryId,
      to: r.categories.id,
    }),
    orderItems: r.many.orderItems({
      from: r.products.id,
      to: r.orderItems.productId,
    }),
  },

  orders: {
    user: r.one.users({
      from: r.orders.userId,
      to: r.users.id,
      optional: false,
    }),
    items: r.many.orderItems({
      from: r.orders.id,
      to: r.orderItems.orderId,
    }),
  },

  orderItems: {
    order: r.one.orders({
      from: r.orderItems.orderId,
      to: r.orders.id,
      optional: false,
    }),
    product: r.one.products({
      from: r.orderItems.productId,
      to: r.products.id,
      optional: false,
    }),
  },
}));
