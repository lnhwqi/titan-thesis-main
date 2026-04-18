import {
  createProductVariantName,
  createProductVariantNameE,
} from "../../../../Core/App/ProductVariant/ProductVariantName"
import { _fromErr } from "../../../Fixture/Result"

describe("App/ProductVariant/ProductVariantName", () => {
  it("valid name", () => {
    ;["Small", "XL", "a".repeat(100)].forEach((n) => {
      const result = createProductVariantName(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid name", () => {
    ;["", "a".repeat(101)].forEach((n) => {
      assert.strictEqual(createProductVariantName(n), null)
    })
  })
})
