import { createVoucherDiscount } from "../../../../Core/App/Voucher/VoucherDiscount"

describe("App/Voucher/VoucherDiscount", () => {
  it("valid discount", () => {
    ;[0, 10, 50, 100].forEach((n) => {
      const result = createVoucherDiscount(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.ok(result.unwrap() >= 0 && result.unwrap() <= 100)
    })
  })

  it("clamps out-of-range values", () => {
    const neg = createVoucherDiscount(-1)
    if (neg == null) throw new Error("-1 should be clamped to 0")
    assert.strictEqual(neg.unwrap(), 0)

    const over = createVoucherDiscount(101)
    if (over == null) throw new Error("101 should be clamped to 100")
    assert.strictEqual(over.unwrap(), 100)
  })

  it("accepts fractional values in range", () => {
    const result = createVoucherDiscount(1.5)
    if (result == null) throw new Error("1.5 should be valid")
    assert.strictEqual(result.unwrap(), 1.5)
  })
})
