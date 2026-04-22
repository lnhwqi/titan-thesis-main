import { createOrderPaymentTrackingCode } from "../../../../Core/App/OrderPayment/OrderPaymentTrackingCode"
import { _fromErr } from "../../../Fixture/Result"

describe("App/OrderPayment/OrderPaymentTrackingCode", () => {
  it("valid tracking code", () => {
    ;["TRACK123", "ABC-789", "a".repeat(100)].forEach((c) => {
      const result = createOrderPaymentTrackingCode(c)
      if (result == null) throw new Error(`${c} should be valid`)
    })
  })

  it("invalid tracking code - empty", () => {
    assert.strictEqual(createOrderPaymentTrackingCode(""), null)
  })

  it("invalid tracking code - too long", () => {
    assert.strictEqual(createOrderPaymentTrackingCode("a".repeat(101)), null)
  })
})
