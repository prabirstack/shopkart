import { defineRelations } from "drizzle-orm"

import * as schema from "./schema"

// Enables db.query.<table>.findMany({ with: { ... } }). Drizzle v1 declares every relation
// in one place; the "one" and "many" sides no longer have to be written as pairs.
export const relations = defineRelations(schema, (r) => ({
  users: {
    addresses: r.many.addresses({ from: r.users.id, to: r.addresses.userId }),
    orders: r.many.orders({ from: r.users.id, to: r.orders.userId }),
    reviews: r.many.reviews({ from: r.users.id, to: r.reviews.userId }),
  },
  addresses: { user: r.one.users({ from: r.addresses.userId, to: r.users.id, optional: false }) },

  categories: { products: r.many.products({ from: r.categories.id, to: r.products.categoryId }) },
  brands: { products: r.many.products({ from: r.brands.id, to: r.products.brandId }) },
  taxCategories: { products: r.many.products({ from: r.taxCategories.id, to: r.products.taxCategoryId }) },

  products: {
    category: r.one.categories({ from: r.products.categoryId, to: r.categories.id, optional: false }),
    brand: r.one.brands({ from: r.products.brandId, to: r.brands.id, optional: false }),
    taxCategory: r.one.taxCategories({ from: r.products.taxCategoryId, to: r.taxCategories.id, optional: false }),
    images: r.many.productImages({ from: r.products.id, to: r.productImages.productId }),
    stock: r.one.stockLevels({ from: r.products.id, to: r.stockLevels.productId }),
    movements: r.many.stockMovements({ from: r.products.id, to: r.stockMovements.productId }),
    reviews: r.many.reviews({ from: r.products.id, to: r.reviews.productId }),
    orderItems: r.many.orderItems({ from: r.products.id, to: r.orderItems.productId }),
  },
  productImages: { product: r.one.products({ from: r.productImages.productId, to: r.products.id, optional: false }) },
  stockLevels: { product: r.one.products({ from: r.stockLevels.productId, to: r.products.id, optional: false }) },
  stockMovements: {
    product: r.one.products({ from: r.stockMovements.productId, to: r.products.id, optional: false }),
    actor: r.one.users({ from: r.stockMovements.actorId, to: r.users.id }),
  },

  coupons: { orders: r.many.orders({ from: r.coupons.id, to: r.orders.couponId }) },
  orders: {
    user: r.one.users({ from: r.orders.userId, to: r.users.id, optional: false }),
    coupon: r.one.coupons({ from: r.orders.couponId, to: r.coupons.id }),
    items: r.many.orderItems({ from: r.orders.id, to: r.orderItems.orderId }),
    events: r.many.orderEvents({ from: r.orders.id, to: r.orderEvents.orderId }),
    notes: r.many.orderNotes({ from: r.orders.id, to: r.orderNotes.orderId }),
    payments: r.many.payments({ from: r.orders.id, to: r.payments.orderId }),
    returns: r.many.returns({ from: r.orders.id, to: r.returns.orderId }),
  },
  orderItems: {
    order: r.one.orders({ from: r.orderItems.orderId, to: r.orders.id, optional: false }),
    product: r.one.products({ from: r.orderItems.productId, to: r.products.id, optional: false }),
  },
  orderNotes: { order: r.one.orders({ from: r.orderNotes.orderId, to: r.orders.id, optional: false }), author: r.one.users({ from: r.orderNotes.authorId, to: r.users.id }) },
  orderEvents: { order: r.one.orders({ from: r.orderEvents.orderId, to: r.orders.id, optional: false }) },
  payments: { order: r.one.orders({ from: r.payments.orderId, to: r.orders.id, optional: false }) },
  returns: { order: r.one.orders({ from: r.returns.orderId, to: r.orders.id, optional: false }) },

  articles: { products: r.many.articleProducts({ from: r.articles.id, to: r.articleProducts.articleId }) },
  articleProducts: {
    article: r.one.articles({ from: r.articleProducts.articleId, to: r.articles.id, optional: false }),
    product: r.one.products({ from: r.articleProducts.productId, to: r.products.id, optional: false }),
  },
  reviews: {
    product: r.one.products({ from: r.reviews.productId, to: r.products.id, optional: false }),
    user: r.one.users({ from: r.reviews.userId, to: r.users.id }),
  },
}))
