import { beforeEach, describe, expect, it } from "vitest"

import { db } from "../../lib/db"
import { addresses, wishlistItems } from "../../lib/db/schema"
import { createOrder, getAccountCounts, listActiveCoupons, listCouponUsesForUser } from "../../lib/db/queries"
import { address, customer, makeCatalog, makeCoupon, makeProduct, makeUser, resetDb } from "../helpers"

const day = 86_400_000
const ago = (n: number) => new Date(Date.now() - n * day)
const ahead = (n: number) => new Date(Date.now() + n * day)

describe("listActiveCoupons", () => {
  beforeEach(resetDb)

  it("lists only coupons that are on, started, unexpired and not used up", async () => {
    await makeCoupon({ code: "GOOD", expiresAt: ahead(5), startsAt: ago(1) })
    await makeCoupon({ code: "NOSTART", expiresAt: ahead(5) }) // no start date means it has already started
    await makeCoupon({ code: "EXPIRED", expiresAt: ago(1) })
    await makeCoupon({ code: "FUTURE", startsAt: ahead(2), expiresAt: ahead(9) })
    await makeCoupon({ code: "OFF", isActive: false })
    await makeCoupon({ code: "FULL", usageLimit: 3, usedCount: 3 })
    await makeCoupon({ code: "LAST", usageLimit: 3, usedCount: 2 })
    const codes = (await listActiveCoupons()).map((c) => c.code)
    expect(codes.sort()).toEqual(["GOOD", "LAST", "NOSTART"])
  })

  it("returns the rule fields the account page needs and nothing internal", async () => {
    await makeCoupon({ code: "FLAT", kind: "flat", value: 20000, minOrderPaise: 199900, expiresAt: ahead(3) })
    const [c] = await listActiveCoupons()
    expect(c).toEqual({ code: "FLAT", kind: "flat", value: 20000, minOrderPaise: 199900, expiresAt: expect.any(Date) })
  })

  it("soonest-ending first", async () => {
    await makeCoupon({ code: "LATER", expiresAt: ahead(30) })
    await makeCoupon({ code: "SOON", expiresAt: ahead(2) })
    expect((await listActiveCoupons()).map((c) => c.code)).toEqual(["SOON", "LATER"])
  })

  it("honours the clock it is given", async () => {
    await makeCoupon({ code: "SOON", expiresAt: ahead(2) })
    expect(await listActiveCoupons(ahead(3))).toEqual([])
  })
})

describe("coupon history and account counts", () => {
  beforeEach(resetDb)

  it("lists only the given customer's coupon uses, with the order and the saving", async () => {
    const cat = await makeCatalog()
    const p = await makeProduct(cat, { pricePaise: 100000 })
    const me = await makeUser(); const other = await makeUser()
    await makeCoupon({ code: "TEN", kind: "percent", value: 10 })
    const mine = await createOrder({ userId: me.id, items: [{ productId: p.id, quantity: 1 }], couponCode: "TEN", customer, shipTo: address, providerOrderId: "order_a" })
    await createOrder({ userId: other.id, items: [{ productId: p.id, quantity: 1 }], couponCode: "TEN", customer, shipTo: address, providerOrderId: "order_b" })
    const uses = await listCouponUsesForUser(me.id)
    expect(uses).toHaveLength(1)
    expect(uses[0]).toMatchObject({ code: "TEN", orderNumber: mine.number, discountPaise: 10000 })
    expect(await listCouponUsesForUser((await makeUser()).id)).toEqual([])
  })

  it("counts addresses and wishlist items for one customer and names the default address", async () => {
    const cat = await makeCatalog()
    const p = await makeProduct(cat)
    const me = await makeUser(); const other = await makeUser()
    await db.insert(addresses).values([{ ...address, userId: me.id, label: "Home", isDefault: true }, { ...address, userId: me.id, label: "Office" }, { ...address, userId: other.id }])
    await db.insert(wishlistItems).values([{ userId: me.id, productId: p.id }, { userId: other.id, productId: p.id }])
    expect(await getAccountCounts(me.id)).toEqual({ addresses: 2, wishlist: 1, defaultAddressLabel: "Home" })
    expect(await getAccountCounts((await makeUser()).id)).toEqual({ addresses: 0, wishlist: 0, defaultAddressLabel: null })
  })
})
