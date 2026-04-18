import {
  createVoucherCode,
  createVoucherCodeE,
} from "../../../../Core/App/Voucher/VoucherCode"
import { _fromErr } from "../../../Fixture/Result"

describe("App/Voucher/VoucherCode", () => {
  it("valid voucher codes", () => {
    ;["SUMMER2025", "SAVE50", "ABC123", "A".repeat(20)].forEach((c) => {
      const result = createVoucherCode(c)
      if (result == null) throw new Error(`${c} should be valid`)
      assert.strictEqual(result.unwrap(), c)
    })
  })

  it("invalid voucher codes - lowercase", () => {
    assert.strictEqual(createVoucherCode("summer"), null)
  })

  it("invalid voucher codes - special chars", () => {
    assert.strictEqual(createVoucherCode("CODE-01"), null)
    assert.strictEqual(createVoucherCode("CODE 01"), null)
  })

  it("invalid voucher codes - empty", () => {
    assert.strictEqual(createVoucherCode(""), null)
  })

  it("invalid voucher codes - too long", () => {
    assert.strictEqual(createVoucherCode("A".repeat(21)), null)
  })

  it("createVoucherCodeE returns error for invalid", () => {
    assert.strictEqual(_fromErr(createVoucherCodeE("")), "INVALID_VOUCHER_CODE")
  })
})
