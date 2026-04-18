import {
  notAsked,
  loading,
  failure,
  success,
  map,
  getError,
  getData,
} from "../../../Core/Data/RemoteData"

describe("Data/RemoteData", () => {
  it("notAsked creates NotAsked", () => {
    assert.deepStrictEqual(notAsked(), { _t: "NotAsked" })
  })

  it("loading creates Loading", () => {
    assert.deepStrictEqual(loading(), { _t: "Loading" })
  })

  it("failure creates Failure", () => {
    const rd = failure("err")
    assert.strictEqual(rd._t, "Failure")
    if (rd._t === "Failure") assert.strictEqual(rd.error, "err")
  })

  it("success creates Success", () => {
    const rd = success(42)
    assert.strictEqual(rd._t, "Success")
    if (rd._t === "Success") assert.strictEqual(rd.data, 42)
  })

  it("map applies fn on Success", () => {
    const rd = map((x: number) => x * 2, success<string, number>(5))
    assert.strictEqual(rd._t, "Success")
    if (rd._t === "Success") assert.strictEqual(rd.data, 10)
  })

  it("map does not change non-Success", () => {
    assert.strictEqual(map((x: number) => x * 2, loading())._t, "Loading")
    assert.strictEqual(map((x: number) => x * 2, notAsked())._t, "NotAsked")
    assert.strictEqual(map((x: number) => x * 2, failure("err"))._t, "Failure")
  })

  it("getError returns error for Failure", () => {
    assert.strictEqual(getError(failure("err")), "err")
  })

  it("getError returns null for non-Failure", () => {
    assert.strictEqual(getError(success(42)), null)
    assert.strictEqual(getError(loading()), null)
    assert.strictEqual(getError(notAsked()), null)
  })

  it("getData returns data for Success", () => {
    assert.strictEqual(getData(success(42)), 42)
  })

  it("getData returns null for non-Success", () => {
    assert.strictEqual(getData(failure("err")), null)
    assert.strictEqual(getData(loading()), null)
    assert.strictEqual(getData(notAsked()), null)
  })
})
