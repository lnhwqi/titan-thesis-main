import { createOrderPaymentID } from "../../../../Core/App/OrderPayment/OrderPaymentID"

describe("App/OrderPayment/OrderPaymentID", () => {
  it("createOrderPaymentID generates a valid ID", () => {
    const id = createOrderPaymentID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createOrderPaymentID generates unique IDs", () => {
    const id1 = createOrderPaymentID()
    const id2 = createOrderPaymentID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
