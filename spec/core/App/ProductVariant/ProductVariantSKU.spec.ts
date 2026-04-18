import {
  createSKU,
  createSKUE,
} from "../../../../Core/App/ProductVariant/ProductVarirantSKU"
import { _fromErr } from "../../../Fixture/Result"

describe("App/ProductVariant/ProductVariantSKU", () => {
  it("valid SKU", () => {
    ;["SKU001", "ABC-123", "product-sku"].forEach((s) => {
      const result = createSKU(s)
      if (result == null) throw new Error(`${s} should be valid`)
      assert.strictEqual(result.unwrap(), s.trim())
    })
  })

  it("invalid SKU - empty", () => {
    assert.strictEqual(createSKU(""), null)
    assert.strictEqual(createSKU("  "), null)
  })

  it("invalid SKU - contains whitespace", () => {
    assert.strictEqual(createSKU("SKU 001"), null)
  })

  it("invalid SKU - too long", () => {
    assert.strictEqual(createSKU("a".repeat(101)), null)
  })

  it("createSKUE returns error for invalid", () => {
    assert.strictEqual(_fromErr(createSKUE("")), "INVALID_SKU")
  })
})
