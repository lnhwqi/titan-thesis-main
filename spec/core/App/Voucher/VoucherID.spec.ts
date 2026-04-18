import { createVoucherID } from "../../../../Core/App/Voucher/VoucherID"

describe("App/Voucher/VoucherID", () => {
  it("createVoucherID generates a valid ID", () => {
    const id = createVoucherID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createVoucherID generates unique IDs", () => {
    const id1 = createVoucherID()
    const id2 = createVoucherID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
