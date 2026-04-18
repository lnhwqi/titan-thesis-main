import {
  createSummaryGoods,
  createSummaryGoodsE,
} from "../../../../Core/App/OrderPayment/SummaryGoods"
import { _fromErr } from "../../../Fixture/Result"

describe("App/OrderPayment/SummaryGoods", () => {
  it("valid summary", () => {
    ;["2x T-shirt, 1x Jeans", "A", "a".repeat(1024)].forEach((s) => {
      const result = createSummaryGoods(s)
      if (result == null) throw new Error(`should be valid`)
    })
  })

  it("invalid summary - empty", () => {
    assert.strictEqual(createSummaryGoods(""), null)
  })

  it("invalid summary - too long", () => {
    assert.strictEqual(createSummaryGoods("a".repeat(1025)), null)
  })
})
