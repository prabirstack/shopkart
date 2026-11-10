import { describe, expect, it } from "vitest"

import { safeNext } from "../../lib/safe-next"

describe("safeNext", () => {
  it("keeps ordinary same-site paths, with query and hash", () => {
    expect(safeNext("/account/orders")).toBe("/account/orders")
    expect(safeNext("/account?tab=1#top")).toBe("/account?tab=1#top")
  })
  it("falls back for empty, relative and absolute URLs", () => {
    for (const bad of [null, undefined, "", "account", "https://evil.example", "http://evil.example/x", "javascript:alert(1)"]) expect(safeNext(bad)).toBe("/account")
  })
  it("blocks protocol-relative and backslash tricks", () => {
    for (const bad of ["//evil.example", "/\\evil.example", "/\\/evil.example", "///evil.example"]) expect(safeNext(bad)).toBe("/account")
  })
  it("blocks dot-segment tricks that normalise to a protocol-relative URL", () => {
    for (const bad of ["/.//evil.example", "/..//evil.example", "/./\/evil.example", "/a/..//evil.example", "/%2e//evil.example"]) expect(safeNext(bad)).toBe("/account")
    expect(safeNext("/a/../b")).toBe("/b") // genuine normalisation to a safe same-site path is fine
  })
  it("blocks control characters and whitespace the browser would strip (parser differential)", () => {
    for (const bad of ["/\t/evil.example", "/\n/evil.example", "/\r/evil.example", "/ /evil.example", "/\u0000/evil.example", "/a b"]) expect(safeNext(bad)).toBe("/account")
    expect(safeNext("/%0a/ok")).toBe("/%0a/ok") // percent-encoded text is harmless and stays
  })
  it("uses the given fallback", () => { expect(safeNext("//x", "/")).toBe("/") })
})
