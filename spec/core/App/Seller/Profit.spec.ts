import { createProfit, createProfitE } from "../../../../Core/App/Seller/Profit"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Seller/Profit", () => {
  it("valid profit", () => {
    ;[0, 1, 1000].forEach((n) => {
      const result = createProfit(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid profit", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createProfit(n), null)
    })
  })

  it("createProfitE returns error for negative", () => {
    assert.strictEqual(_fromErr(createProfitE(-1)), "INVALID_PROFIT")
  })
})
