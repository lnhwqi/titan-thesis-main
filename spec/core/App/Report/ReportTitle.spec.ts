import {
  reportTitleFromCategory,
  isReportTitleMatchingCategory,
  reportTitleDecoder,
} from "../../../../Core/App/Report/ReportTitle"

describe("App/Report/ReportTitle", () => {
  it("maps category to title", () => {
    assert.strictEqual(reportTitleFromCategory("WRONG_ITEM"), "Wrong Product")
    assert.strictEqual(
      reportTitleFromCategory("DEFECTIVE"),
      "Defective Product",
    )
    assert.strictEqual(
      reportTitleFromCategory("ITEM_NOT_RECEIVED"),
      "Item Not Received",
    )
    assert.strictEqual(reportTitleFromCategory("FALSE_CLAIM"), "False Claim")
  })

  it("isReportTitleMatchingCategory returns true for matching", () => {
    assert.strictEqual(
      isReportTitleMatchingCategory("WRONG_ITEM", "Wrong Product"),
      true,
    )
  })

  it("isReportTitleMatchingCategory returns false for non-matching", () => {
    assert.strictEqual(
      isReportTitleMatchingCategory("WRONG_ITEM", "Defective Product"),
      false,
    )
  })

  it("reportTitleDecoder decodes valid titles", () => {
    ;[
      "Wrong Product",
      "Defective Product",
      "Item Not Received",
      "False Claim",
    ].forEach((t) => {
      const result = reportTitleDecoder.decode(t)
      assert.strictEqual(result.ok, true)
    })
  })

  it("reportTitleDecoder rejects invalid titles", () => {
    const result = reportTitleDecoder.decode("Invalid Title")
    assert.strictEqual(result.ok, false)
  })
})
