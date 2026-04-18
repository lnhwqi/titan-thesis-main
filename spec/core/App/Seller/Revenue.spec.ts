import {
  createRevenue,
  createRevenueE,
} from "../../../../Core/App/Seller/Revenue"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Seller/Revenue", () => {
  it("valid revenue", () => {
    ;[0, 1, 1000].forEach((n) => {
      const result = createRevenue(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid revenue", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createRevenue(n), null)
    })
  })

  it("createRevenueE returns error for negative", () => {
    assert.strictEqual(_fromErr(createRevenueE(-1)), "INVALID_REVENUE")
  })
})
