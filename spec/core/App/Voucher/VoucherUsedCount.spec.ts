import { createUsedCount } from "../../../../Core/App/Voucher/VoucherUsedCount"

describe("App/Voucher/VoucherUsedCount", () => {
  it("valid used count", () => {
    ;[0, 1, 100].forEach((n) => {
      const result = createUsedCount(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid used count", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createUsedCount(n), null)
    })
  })
})
