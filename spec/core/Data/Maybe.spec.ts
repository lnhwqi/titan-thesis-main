import {
  maybe,
  fromMaybe,
  fromResult,
  mapMaybe,
  throwIfNull,
} from "../../../Core/Data/Maybe"
import { ok, err } from "../../../Core/Data/Result"

describe("Data/Maybe", () => {
  it("maybe returns value for non-null", () => {
    assert.strictEqual(maybe(42), 42)
    assert.strictEqual(maybe("hello"), "hello")
  })

  it("maybe returns null for null/undefined", () => {
    assert.strictEqual(maybe(null), null)
    assert.strictEqual(maybe(undefined), null)
  })

  it("fromMaybe returns value for non-null", () => {
    assert.strictEqual(fromMaybe(42), 42)
  })

  it("fromMaybe returns null for null", () => {
    assert.strictEqual(fromMaybe(null), null)
  })

  it("fromResult returns value for Ok", () => {
    assert.strictEqual(fromResult(ok(10)), 10)
  })

  it("fromResult returns null for Err", () => {
    assert.strictEqual(fromResult(err("fail")), null)
  })

  it("mapMaybe applies fn for non-null", () => {
    assert.strictEqual(
      mapMaybe(5, (x) => x * 2),
      10,
    )
  })

  it("mapMaybe returns null for null", () => {
    assert.strictEqual(
      mapMaybe(null, (x: number) => x * 2),
      null,
    )
  })

  it("throwIfNull returns value for non-null", () => {
    assert.strictEqual(throwIfNull(42, "error"), 42)
  })

  it("throwIfNull throws for null", () => {
    expect(() => throwIfNull(null, "missing")).toThrow("missing")
  })
})
