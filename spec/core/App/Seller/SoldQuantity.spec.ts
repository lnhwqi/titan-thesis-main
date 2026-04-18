import {
  createSoldQuantity,
  createSoldQuantityE,
} from "../../../../Core/App/Seller/SoldQuantity"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Seller/SoldQuantity", () => {
  it("valid sold quantity", () => {
    ;[0, 1, 100].forEach((n) => {
      const result = createSoldQuantity(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid sold quantity", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createSoldQuantity(n), null)
    })
  })

  it("createSoldQuantityE returns error for negative", () => {
    assert.strictEqual(
      _fromErr(createSoldQuantityE(-1)),
      "INVALID_SOLD_QUANTITY",
    )
  })
})
