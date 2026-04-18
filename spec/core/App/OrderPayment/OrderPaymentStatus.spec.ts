import { orderPaymentStatusDecoder } from "../../../../Core/App/OrderPayment/OrderPaymentStatus"

describe("App/OrderPayment/OrderPaymentStatus", () => {
  it("valid statuses", () => {
    ;[
      "PAID",
      "PACKED",
      "IN_TRANSIT",
      "DELIVERED",
      "RECEIVED",
      "REPORTED",
      "DELIVERY_ISSUE",
      "CANCELLED",
    ].forEach((s) => {
      const result = orderPaymentStatusDecoder.decode(s)
      assert.strictEqual(result.ok, true)
    })
  })

  it("invalid status", () => {
    ;["", "UNKNOWN", "paid", "PENDING"].forEach((s) => {
      const result = orderPaymentStatusDecoder.decode(s)
      assert.strictEqual(result.ok, false)
    })
  })
})
