import {
  createMinOrderValue,
  createMinOrderValueE,
} from "../../../../Core/App/Voucher/VoucherMinOrderValue"

describe("App/Voucher/VoucherMinOrderValue", () => {
  it("valid min order value", () => {
    ;[0, 100, 1000].forEach((n) => {
      const result = createMinOrderValue(n)
      if (result == null) throw new Error(`${n} should be valid`)
      assert.strictEqual(result.unwrap(), n)
    })
  })

  it("invalid min order value", () => {
    ;[-1, 1.5].forEach((n) => {
      assert.strictEqual(createMinOrderValue(n), null)
    })
  })
})
