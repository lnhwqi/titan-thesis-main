import { reportCategoryDecoder } from "../../../../Core/App/Report/ReportCategory"

describe("App/Report/ReportCategory", () => {
  it("valid categories", () => {
    ;["WRONG_ITEM", "DEFECTIVE", "ITEM_NOT_RECEIVED", "FALSE_CLAIM"].forEach(
      (c) => {
        const result = reportCategoryDecoder.decode(c)
        assert.strictEqual(result.ok, true)
      },
    )
  })

  it("invalid categories", () => {
    ;["", "UNKNOWN", "wrong_item", "OTHER"].forEach((c) => {
      const result = reportCategoryDecoder.decode(c)
      assert.strictEqual(result.ok, false)
    })
  })
})
