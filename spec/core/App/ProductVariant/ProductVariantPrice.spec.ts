import {
  createPrice,
  createPriceE,
} from "../../../../Core/App/ProductVariant/ProductVariantPrice"
import { _fromErr } from "../../../Fixture/Result"

describe("App/ProductVariant/ProductVariantPrice", () => {
  it("valid price", () => {
    ;[0, 1, 100, 2147483647].forEach((n) => {
      const result = createPrice(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid price", () => {
    ;[-1, 1.5, 2147483648].forEach((n) => {
      assert.strictEqual(createPrice(n), null)
    })
  })

  it("createPriceE returns error for negative", () => {
    assert.strictEqual(_fromErr(createPriceE(-1)), "INVALID_PRICE")
  })
})
