import { retryPromise } from "../../../Core/Data/Promise"
import { ok, err } from "../../../Core/Data/Result"

describe("Data/Promise", () => {
  it("retryPromise returns Ok when first attempt succeeds", async () => {
    const result = await retryPromise(3, () => Promise.resolve(ok(42)))
    assert.deepStrictEqual(result, { _t: "Ok", value: 42 })
  })

  it("retryPromise retries on failure and succeeds", async () => {
    let attempt = 0
    const result = await retryPromise(3, () => {
      attempt++
      return Promise.resolve(attempt < 3 ? err("fail") : ok("success"))
    })
    assert.deepStrictEqual(result, { _t: "Ok", value: "success" })
  })

  it("retryPromise returns last error when all retries fail", async () => {
    const result = await retryPromise(2, () => Promise.resolve(err("fail")))
    assert.deepStrictEqual(result, { _t: "Err", error: "fail" })
  })
})
