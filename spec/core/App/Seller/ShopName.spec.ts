import {
  createShopName,
  createShopNameE,
} from "../../../../Core/App/Seller/ShopName"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Seller/ShopName", () => {
  it("valid shop name", () => {
    ;["My Shop", "A", "a".repeat(100)].forEach((n) => {
      const result = createShopName(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid shop name", () => {
    ;["", "a".repeat(101)].forEach((n) => {
      assert.strictEqual(createShopName(n), null)
    })
  })

  it("createShopNameE returns error for empty", () => {
    assert.strictEqual(_fromErr(createShopNameE("")), "INVALID_SHOP_NAME")
  })
})
