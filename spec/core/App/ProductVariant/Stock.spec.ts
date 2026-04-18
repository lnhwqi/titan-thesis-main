import {
  createStock,
  createStockE,
} from "../../../../Core/App/ProductVariant/Stock"
import { _fromErr } from "../../../Fixture/Result"

describe("App/ProductVariant/Stock", () => {
  it("valid stock", () => {
    ;[0, 1, 100, 999].forEach((n) => {
      const result = createStock(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid stock", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createStock(n), null)
    })
  })

  it("createStockE returns error for negative", () => {
    const result = createStockE(-1)
    assert.strictEqual(result._t, "Err")
  })
})
