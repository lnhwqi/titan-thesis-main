import { createExpiredDate } from "../../../../Core/App/Voucher/VoucherExpiredDate"

describe("App/Voucher/VoucherExpiredDate", () => {
  it("valid expired date", () => {
    ;[0, 1000000, Date.now()].forEach((n) => {
      const result = createExpiredDate(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid expired date", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createExpiredDate(n), null)
    })
  })
})
