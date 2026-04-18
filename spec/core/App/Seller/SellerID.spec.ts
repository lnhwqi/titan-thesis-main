import { createSellerID } from "../../../../Core/App/Seller/SellerID"

describe("App/Seller/SellerID", () => {
  it("createSellerID generates a valid ID", () => {
    const id = createSellerID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createSellerID generates unique IDs", () => {
    const id1 = createSellerID()
    const id2 = createSellerID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
