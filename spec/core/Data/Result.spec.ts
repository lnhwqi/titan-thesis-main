import {
  ok,
  err,
  mapOk,
  mapErr,
  toMaybe,
  value,
  error,
} from "../../../Core/Data/Result"

describe("Data/Result", () => {
  it("ok creates Ok result", () => {
    const r = ok(42)
    assert.strictEqual(r._t, "Ok")
    assert.strictEqual(r.value, 42)
  })

  it("err creates Err result", () => {
    const r = err("fail")
    assert.strictEqual(r._t, "Err")
    assert.strictEqual(r.error, "fail")
  })

  it("mapOk applies fn on Ok", () => {
    const r = mapOk(ok(5), (x) => x * 2)
    assert.deepStrictEqual(r, { _t: "Ok", value: 10 })
  })

  it("mapOk does not change Err", () => {
    const r = mapOk(err("fail"), (x: number) => x * 2)
    assert.deepStrictEqual(r, { _t: "Err", error: "fail" })
  })

  it("mapErr applies fn on Err", () => {
    const r = mapErr(err("fail"), (e) => e.toUpperCase())
    assert.deepStrictEqual(r, { _t: "Err", error: "FAIL" })
  })

  it("mapErr does not change Ok", () => {
    const r = mapErr(ok(5), (e: string) => e.toUpperCase())
    assert.deepStrictEqual(r, { _t: "Ok", value: 5 })
  })

  it("toMaybe returns value for Ok", () => {
    assert.strictEqual(toMaybe(ok(10)), 10)
  })

  it("toMaybe returns null for Err", () => {
    assert.strictEqual(toMaybe(err("fail")), null)
  })

  it("value returns value for Ok", () => {
    assert.strictEqual(value(ok(10)), 10)
  })

  it("value returns null for Err", () => {
    assert.strictEqual(value(err("fail")), null)
  })

  it("error returns error for Err", () => {
    assert.strictEqual(error(err("fail")), "fail")
  })

  it("error returns null for Ok", () => {
    assert.strictEqual(error(ok(10)), null)
  })
})
