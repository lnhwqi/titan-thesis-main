import { createUsageLimit } from "../../../../Core/App/Voucher/VoucherLimit"

describe("App/Voucher/VoucherLimit", () => {
  it("valid usage limit", () => {
    ;[0, 1, 100].forEach((n) => {
      const result = createUsageLimit(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid usage limit", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createUsageLimit(n), null)
    })
  })
})
