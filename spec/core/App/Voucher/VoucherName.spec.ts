import { createVoucherName } from "../../../../Core/App/Voucher/VoucherName"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Voucher/VoucherName", () => {
  it("valid voucher name", () => {
    ;["Summer Sale", "A", "a".repeat(100)].forEach((n) => {
      const result = createVoucherName(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid voucher name", () => {
    ;["", "a".repeat(101)].forEach((n) => {
      assert.strictEqual(createVoucherName(n), null)
    })
  })
})
