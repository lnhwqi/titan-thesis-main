import { reportStatusDecoder } from "../../../../Core/App/Report/ReportStatus"

describe("App/Report/ReportStatus", () => {
  it("valid statuses", () => {
    ;[
      "OPEN",
      "SELLER_REPLIED",
      "UNDER_REVIEW",
      "REFUND_APPROVED",
      "CASHBACK_COMPLETED",
      "RESOLVED",
      "REJECTED",
    ].forEach((s) => {
      const result = reportStatusDecoder.decode(s)
      assert.strictEqual(result.ok, true)
    })
  })

  it("invalid statuses", () => {
    ;["", "UNKNOWN", "open", "PENDING"].forEach((s) => {
      const result = reportStatusDecoder.decode(s)
      assert.strictEqual(result.ok, false)
    })
  })
})
