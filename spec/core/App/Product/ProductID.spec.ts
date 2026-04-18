import { createProductID } from "../../../../Core/App/Product/ProductID"

describe("App/Product/ProductID", () => {
  it("createProductID generates a valid ID", () => {
    const id = createProductID()
    assert.ok(id.unwrap().length > 0)
  })

  it("createProductID generates unique IDs", () => {
    const id1 = createProductID()
    const id2 = createProductID()
    assert.notStrictEqual(id1.unwrap(), id2.unwrap())
  })
})
